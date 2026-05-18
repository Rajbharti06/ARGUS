"""
ARGUS — WebSocket Connection Manager & Event Stream
Enables real-time dashboard updates across all connected clients.
"""

import json
import asyncio
from datetime import datetime, timezone
from typing import Optional
from fastapi import WebSocket, WebSocketDisconnect

from app.core.logging import logger
from app.events.bus import event_bus, EventType, ArgusEvent


class ConnectionManager:
    """Manages WebSocket connections for real-time dashboard streaming."""

    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}
        self.connection_metadata: dict[str, dict] = {}

    async def connect(self, websocket: WebSocket, client_id: Optional[str] = None):
        await websocket.accept()
        cid = client_id or f"client-{id(websocket)}"
        self.active_connections[cid] = websocket
        self.connection_metadata[cid] = {
            "connected_at": datetime.now(timezone.utc).isoformat(),
            "client_ip": websocket.client.host if websocket.client else "unknown",
        }
        logger.info(f"WS client connected: {cid} (total: {len(self.active_connections)})")

        # Send welcome message
        await self._send(cid, {
            "type": "connection_established",
            "client_id": cid,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "system": "ARGUS Real-Time Intelligence Stream",
        })

        return cid

    async def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            try:
                await self.active_connections[client_id].close()
            except Exception:
                pass
            del self.active_connections[client_id]
            self.connection_metadata.pop(client_id, None)
            logger.info(f"WS client disconnected: {client_id} (total: {len(self.active_connections)})")

    async def broadcast(self, message: dict):
        """Broadcast a message to all connected clients."""
        disconnected = []
        for cid, ws in self.active_connections.items():
            try:
                await ws.send_json(message)
            except Exception:
                disconnected.append(cid)

        for cid in disconnected:
            await self.disconnect(cid)

    async def broadcast_event(self, event: ArgusEvent):
        """Broadcast an ARGUS event to all connected clients."""
        payload = {
            "type": "argus_event",
            "event_id": event.id,
            "event_type": event.type.value,
            "source": event.source.value,
            "priority": event.priority.value,
            "payload": event.payload,
            "correlation_id": event.correlation_id,
            "timestamp": event.timestamp,
        }
        await self.broadcast(payload)

    async def _send(self, client_id: str, message: dict):
        if client_id in self.active_connections:
            try:
                await self.active_connections[client_id].send_json(message)
            except Exception:
                await self.disconnect(client_id)

    @property
    def connection_count(self) -> int:
        return len(self.active_connections)

    def get_status(self) -> dict:
        return {
            "active_connections": self.connection_count,
            "connections": [
                {"client_id": cid, **meta}
                for cid, meta in self.connection_metadata.items()
            ],
        }


manager = ConnectionManager()


async def websocket_endpoint(websocket: WebSocket, client_id: Optional[str] = None):
    """WebSocket endpoint for real-time ARGUS intelligence streaming."""
    cid = await manager.connect(websocket, client_id)
    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            msg_type = msg.get("type", "")

            if msg_type == "ping":
                await manager._send(cid, {"type": "pong", "timestamp": datetime.now(timezone.utc).isoformat()})

            elif msg_type == "subscribe":
                event_types = msg.get("events", [])
                await manager._send(cid, {
                    "type": "subscribed",
                    "events": event_types,
                    "message": f"Subscribed to {len(event_types)} event types",
                })

            elif msg_type == "get_status":
                await manager._send(cid, manager.get_status())

            else:
                await manager._send(cid, {
                    "type": "echo",
                    "original_type": msg_type,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                })

    except WebSocketDisconnect:
        await manager.disconnect(cid)
    except Exception as e:
        logger.error(f"WS error [{cid}]: {e}")
        await manager.disconnect(cid)


# ── Background bridge: forward EventBus events to WebSocket clients ─────────

async def event_bus_to_websocket_bridge():
    """Continuously forward EventBus events to all connected WebSocket clients."""
    while True:
        try:
            events = event_bus.get_history(limit=10)
            for event in events:
                if not event.is_expired():
                    await manager.broadcast_event(event)
        except Exception as e:
            logger.error(f"Event bridge error: {e}")
        await asyncio.sleep(1)


async def broadcast_event(event: ArgusEvent):
    """Helper to publish an event and broadcast via WebSocket."""
    await event_bus.publish(event)
    await manager.broadcast_event(event)

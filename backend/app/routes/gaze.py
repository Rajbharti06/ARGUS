"""GAZE — Global Awareness & Zero-trust Engine routes"""

import os
from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.services.gaze_service import hunt, detect_entity_type

router = APIRouter()


class HuntRequest(BaseModel):
    query: str
    github_token: str = ''


@router.post('/hunt')
async def gaze_hunt(req: HuntRequest):
    token = req.github_token or os.getenv('GITHUB_TOKEN', '')
    return await hunt(req.query.strip(), token)


@router.get('/detect')
def gaze_detect(q: str = Query(..., description='Entity to classify')):
    return {'query': q, 'entity_type': detect_entity_type(q.strip())}

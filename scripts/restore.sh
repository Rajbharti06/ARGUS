#!/usr/bin/env bash
# ARGUS — Database Restore Script
# Usage: ./scripts/restore.sh <backup_file.sql.gz>

set -euo pipefail

BACKUP_FILE="${1:-}"

if [ -z "${BACKUP_FILE}" ]; then
    echo "Usage: ./scripts/restore.sh <backup_file.sql.gz>"
    exit 1
fi

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "ERROR: ${BACKUP_FILE} not found"
    exit 1
fi

echo "═══ ARGUS Database Restore ═══"
echo "File: ${BACKUP_FILE}"

gunzip -c "${BACKUP_FILE}" | docker exec -i argus-postgres \
    psql -U argus -d argus

echo "✓ Restore complete"

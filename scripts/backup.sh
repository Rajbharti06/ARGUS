#!/usr/bin/env bash
# ARGUS — Database Backup Script
# Usage: ./scripts/backup.sh [output_dir]

set -euo pipefail

OUTPUT_DIR="${1:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${OUTPUT_DIR}/argus_db_${TIMESTAMP}.sql"

mkdir -p "${OUTPUT_DIR}"

echo "═══ ARGUS Database Backup ═══"
echo "Output: ${BACKUP_FILE}"

docker exec argus-postgres pg_dump \
    -U argus \
    -d argus \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges \
    > "${BACKUP_FILE}"

gzip "${BACKUP_FILE}"

echo "✓ Backup complete: ${BACKUP_FILE}.gz ($(du -h "${BACKUP_FILE}.gz" | cut -f1))"

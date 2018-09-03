#!/bin/bash

if [[ ${EUID} != 0 ]]; then
    echo "[-] This task must be run with 'sudo'."
    exit 1
fi

if $(ps x | grep "node ${SNAP}/main.js" | grep -qv "grep"); then
    echo "[-] Please shutdown Rocket.Chat first to get a clean backup"
    echo "[-] Use 'sudo systemctl stop snap.rocketchat-server.rocketchat-server'"
fi

TIMESTAMP=$(date +"%Y%m%d.%H%M")
BACKUP_DIR="${SNAP_COMMON}/backup"

if [[ ! -d ${BACKUP_DIR} ]]; then
    mkdir ${BACKUP_DIR}
fi

if [[ -d ${BACKUP_DIR}/dump ]]; then
    rm -rf ${BACKUP_DIR}/dump
fi

if [[ -f ${BACKUP_DIR}/rocketchat_backup_${TIMESTAMP}.tar.gz ]]; then
    rm -f ${BACKUP_DIR}/rocketchat_backup_${TIMESTAMP}.tar.gz
fi

if [[ -f ${BACKUP_DIR}/backup_${TIMESTAMP}.log ]]; then
    rm -f ${BACKUP_DIR}/backup_${TIMESTAMP}.log
fi

echo "[*] Creating backup file..."
mkdir ${BACKUP_DIR}/dump
echo "[*] Dumping database with \"mongodump -d parties -o ${BACKUP_DIR}/dump\"" > "${BACKUP_DIR}/backup_${TIMESTAMP}.log"
mongodump -d parties -o ${BACKUP_DIR}/dump &>> "${BACKUP_DIR}/backup_${TIMESTAMP}.log"
echo "[*] Packing archive with \"tar czvf ${BACKUP_DIR}/rocketchat_backup_${TIMESTAMP}.tar.gz ${BACKUP_DIR}/dump\"" >> "${BACKUP_DIR}/backup_${TIMESTAMP}.log"
tar czvf ${BACKUP_DIR}/rocketchat_backup_${TIMESTAMP}.tar.gz -C ${BACKUP_DIR} dump &>> "${BACKUP_DIR}/backup_${TIMESTAMP}.log"
rm -rf ${BACKUP_DIR}/dump

echo "[+] A backup of your data can be found at ${BACKUP_DIR}/rocketchat_backup_${TIMESTAMP}.tar.gz"

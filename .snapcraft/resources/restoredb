#!/bin/bash

function warn {
        echo "[!] ${1}"
        echo "[*] Check ${RESTORE_DIR}/${LOG_NAME} for details."
}

function abort {
        echo "[!] ${1}"
        echo "[*] Check ${RESTORE_DIR}/${LOG_NAME} for details."
        echo "[-] Restore aborted!"
        exit 1
}

if [[ ${EUID} != 0 ]]; then
    echo "[-] This task must be run with 'sudo'."
    exit 1
fi

echo "*** ATTENTION ***"
echo "* Your current database WILL BE DROPPED prior to the restore!"
echo "* Do you want to continue?"

select yn in "Yes" "No"; do
    case $yn in
        Yes ) break;;
        No ) exit 1;;
    esac
done

if $(ps x | grep "node ${SNAP}/main.js" | grep -qv "grep"); then
    echo "[-] Please shutdown Rocket.Chat first to restore a clean backup"
    echo "[-] Use 'sudo systemctl stop snap.rocketchat-server.rocketchat-server'"
    echo "[-] Backup aborted!"
    exit 1
fi

TIMESTAMP=$(date +"%Y%m%d.%H%M")
RESTORE_DIR="${SNAP_COMMON}/restore"
DATA_DIR="${RESTORE_DIR}/dump/parties"
LOG_NAME="restore_${TIMESTAMP}.log"

if [[ ! -d ${RESTORE_DIR} ]]; then
    mkdir ${RESTORE_DIR}
fi

if [[ -d ${RESTORE_DIR}/dump ]]; then
    rm -rf ${RESTORE_DIR}/dump
fi

if [[ -f ${RESTORE_DIR}/${LOG_NAME} ]]; then
    rm -f ${RESTORE_DIR}/${LOG_NAME}
fi

BACKUP_FILE=${1}
if [[ ! -f ${BACKUP_FILE} ]]; then
    echo "[-] Usage: sudo snap run rocketchat-server.restoredb ${SNAP_COMMON}/rocketchat_backup_{TIMESTAMP}.tar.gz"
    exit 1
fi

if ! $(echo "${BACKUP_FILE}" | grep -q "${SNAP_COMMON}"); then
    echo "[-] Backup file must be within ${SNAP_COMMON}."
    exit 1
fi

echo "[*] Extracting backup file..."
echo "[*] Extracting backup file with \"tar --no-same-owner --overwrite -xzvf ${BACKUP_FILE}\"" &> "${RESTORE_DIR}/${LOG_NAME}"
cd ${RESTORE_DIR}
tar --no-same-owner --overwrite -xzvf ${BACKUP_FILE} &>> "${RESTORE_DIR}/${LOG_NAME}" \
    || abort "Failed to extract backup files to ${RESTORE_DIR}!"

if [ $(ls -l ${DATA_DIR} | wc -l) -le 1 ]; then
    abort "No restore data found within ${DATA_DIR}!"
fi
echo "[*] Restoring data..."
echo "[*] Restoring data with \"mongorestore --db parties --noIndexRestore --drop ${DATA_DIR}\"" &>> "${RESTORE_DIR}/${LOG_NAME}"
mongorestore --db parties --noIndexRestore --drop ${DATA_DIR} &>> "${RESTORE_DIR}/${LOG_NAME}" \
    || abort "Failed to execute mongorestore from ${DATA_DIR}!"
if [ $(cat ${RESTORE_DIR}/${LOG_NAME} | grep $(date +%Y) | wc -l) -lt 24 ]; then
    warn "Little or no data could be restored from the backup!"
fi

echo "[*] Preparing database..."
echo "[*] Preparing database with \"mongo parties --eval 'db.repairDatabase()' --verbose\"" &>> "${RESTORE_DIR}/${LOG_NAME}"
mongo parties --eval "db.repairDatabase()" --verbose &>> "${RESTORE_DIR}/${LOG_NAME}" \
    || abort "Failed to prepare database for usage!"

echo "[+] Restore completed! Please with 'sudo systemctl restart snap.rocketchat-server.rocketchat-server' to verify."

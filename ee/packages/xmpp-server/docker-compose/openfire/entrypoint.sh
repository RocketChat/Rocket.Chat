#!/bin/bash
# Boots Openfire unattended, serving the stack's certificate and trusting the stack's CA.
set -euo pipefail

conf="${OPENFIRE_DATA_DIR}/conf"
security="${conf}/security"
storepass=changeit

if [[ ! -d "${conf}" ]]; then
	cp -a "${OPENFIRE_DIR}/conf_org" "${conf}"
	cp -a "${OPENFIRE_DIR}/plugins_org" "${OPENFIRE_DATA_DIR}/plugins"
	cp -a "${OPENFIRE_DIR}/resources/security_org" "${security}"
	cp /stack/openfire.xml "${conf}/openfire.xml"
fi

# The certificates can be reissued while this volume survives, so both stores are refreshed on every start
openssl pkcs12 -export -name openfire.test -passout "pass:${storepass}" \
	-in /certs/openfire.pem -inkey /certs/openfire-key.pem -out /tmp/openfire.p12
keytool -delete -alias openfire.test -keystore "${security}/keystore" -storepass "${storepass}" >/dev/null 2>&1 || true
keytool -importkeystore -noprompt -srckeystore /tmp/openfire.p12 -srcstoretype PKCS12 -srcstorepass "${storepass}" \
	-destkeystore "${security}/keystore" -deststorepass "${storepass}"
rm /tmp/openfire.p12

keytool -delete -alias stack-ca -keystore "${security}/truststore" -storepass "${storepass}" >/dev/null 2>&1 || true
keytool -importcert -noprompt -alias stack-ca -file /certs/ca.pem -keystore "${security}/truststore" -storepass "${storepass}"

exec /sbin/entrypoint.sh "$@"

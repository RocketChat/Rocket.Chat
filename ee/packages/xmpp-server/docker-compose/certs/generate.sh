#!/bin/sh
# Issues a private CA and the certificate of each XMPP domain in the stack, once per stack lifetime.
set -eu

out=/certs/generated
mkdir -p "$out"

if [ -f "$out/ca.pem" ]; then
	echo "Certificates already issued for this stack"
	exit 0
fi

openssl req -x509 -newkey rsa:2048 -nodes -days 30 \
	-subj "/CN=Rocket.Chat XMPP stack CA" \
	-addext "basicConstraints=critical,CA:TRUE" \
	-addext "keyUsage=critical,keyCertSign,cRLSign" \
	-keyout "$out/ca-key.pem" -out "$out/ca.pem"

issue() {
	name=$1
	domain=$2

	cat >"$out/$name.ext" <<EOF
subjectAltName=DNS:$domain,DNS:conference.$domain
extendedKeyUsage=serverAuth,clientAuth
EOF
	openssl req -newkey rsa:2048 -nodes -subj "/CN=$domain" -keyout "$out/$name-key.pem" -out "$out/$name.csr"
	openssl x509 -req -in "$out/$name.csr" -CA "$out/ca.pem" -CAkey "$out/ca-key.pem" -set_serial "0x$(openssl rand -hex 16)" \
		-days 30 -extfile "$out/$name.ext" -out "$out/$name.pem"
	rm "$out/$name.csr" "$out/$name.ext"
}

issue rocketchat rc.test
issue openfire openfire.test

# Only the issuing above needs the CA key; the containers that mount this folder never see it
rm "$out/ca-key.pem"

# Rocket.Chat and Openfire read these as unprivileged users
chmod 644 "$out"/*.pem

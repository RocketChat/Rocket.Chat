#!/bin/bash
set -x
set -euvo pipefail
IFS=$'\n\t'

cp .circleci/sign.key.gpg /tmp
gpg --yes --batch --passphrase=$GPG_PASSWORD /tmp/sign.key.gpg
gpg --allow-secret-key-import --import /tmp/sign.key
rm /tmp/sign.key

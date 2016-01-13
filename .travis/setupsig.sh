#!/bin/bash

set -euo pipefail

cp .travis/sign.key.gpg  /tmp
gpg --yes --batch --passphrase=$mypass /tmp/sign.key.gpg
gpg --allow-secret-key-import --import /tmp/sign.key
rm /tmp/sign.key

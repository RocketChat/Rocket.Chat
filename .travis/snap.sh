#!/bin/bash
set -x
set -euvo pipefail
IFS=$'\n\t'

if [ -z "$SNAPCRAFT_SECRET" ]; then
    exit 0
fi

mkdir -p ".encrypted"
if [ ! -e ".encrypted/snapcraft.cfg.enc" ]; then
    echo "Seeding a new macaroon."
    echo "$SNAPCRAFT_CONFIG" > ".encrypted/snapcraft.cfg.enc"
fi

mkdir -p "$HOME/.config/snapcraft"
openssl enc -aes-256-cbc -base64 -pass env:SNAPCRAFT_SECRET -d -in ".encrypted/snapcraft.cfg.enc" -out "$HOME/.config/snapcraft/snapcraft.cfg"

if [[ $TRAVIS_TAG ]]
 then
    CHANNEL=stable
    SNAP_FOLDER=$PWD/.snapcraft/stable
else
    CHANNEL=edge
    SNAP_FOLDER=$PWD/.snapcraft/edge
fi

echo "snapping release for $CHANNEL channel"

docker run -v $HOME:/root -v $SNAP_FOLDER:/cwd snapcore/snapcraft sh -c 'cd /cwd; apt update && snapcraft'
docker run -v $HOME:/root -v $SNAP_FOLDER:/cwd -e CHANNEL=$CHANNEL snapcore/snapcraft sh -c "cd /cwd; snapcraft push *.snap --release $CHANNEL"

openssl enc -aes-256-cbc -base64 -pass env:SNAPCRAFT_SECRET -out ".encrypted/snapcraft.cfg.enc" < "$HOME/.config/snapcraft/snapcraft.cfg"
rm -f "$HOME/.config/snapcraft/snapcraft.cfg"


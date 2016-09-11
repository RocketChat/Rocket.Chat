#!/bin/bash
set -x

mkdir -p "$HOME/.config/snapcraft"

echo "$SNAPCRAFT_CONFIG" > "$HOME/.config/snapcraft/snapcraft.cfg"

if [[ $TRAVIS_TAG ]]
 then
    CHANNEL=stable
    SNAP_FOLDER=./snapcraft/stable
else
    CHANNEL=edge
    SNAP_FOLDER=./snapcraft/edge
fi

docker run -v $HOME:/root -v $SNAP_FOLDER:/cwd didrocks/snapcraft sh -c 'cd /cwd; snapcraft'
docker run -v $HOME:/root -v $SNAP_FOLDER:/cwd -e CHANNEL=$CHANNEL didrocks/snapcraft sh -c "cd /cwd; snapcraft push *.snap --release $CHANNEL"


#!/bin/bash

if [ "${@:1:1}" != "undo" ]; then
    echo "linking local project"
else
    echo "unlinking local project"
fi

cd ./node_modules/@rocket.chat

rm -rf fuselage

if [ "${@:1:1}" != "undo" ]; then
    ln -s ../../../fuselage/packages/fuselage fuselage
fi

cd ../..
cd ./apps/meteor/node_modules/@rocket.chat
rm -rf fuselage
if [ "${@:1:1}" != "undo" ]; then
    echo "linking local project"
    ln -s ../../../../../fuselage/packages/fuselage fuselage
fi

cd ../../../../
if [ "${@:1:1}" == "undo" ]; then
    yarn
fi

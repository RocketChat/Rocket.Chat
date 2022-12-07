#!/bin/bash

if [[ $1 == "--help" || $1 == "-h" ]]; then
    echo "Usage: fuselage.sh -a link|undo -p fuselage;fuselage-icons"
    exit 1
fi

while getopts ":a:p:" opt; do
  case $opt in
    a) action="$OPTARG"
    ;;
    p) packages="$OPTARG"
    ;;
    \?) echo "Invalid option -$OPTARG" >&2
    exit 1
    ;;
  esac

  case $OPTARG in
    -*) echo "Option $opt needs a valid argument"
    exit 1
    ;;
  esac
done

echo "action: $action"

action="${action:-link}"
packages="${packages:-fuselage}"

if [[ $action != "link" && $action != "undo" ]]; then
    echo "Invalid action"
    exit 1
fi

if [[ $action != "undo" ]]; then
    echo "linking local project"
else
    echo "unlinking local project"
fi

cd ./node_modules/@rocket.chat


for i in $(echo $packages | tr ";" "\n")
    do
    rm -rf $i
    if [[ $action != "undo" ]]; then
        ln -s "../../../fuselage/packages/$i" $i
        echo "root $i"
    fi
    done


cd ../..
cd ./apps/meteor/node_modules/@rocket.chat

for i in $(echo $packages | tr ";" "\n")
    do
    rm -rf $i
    if [[ $action != "undo" ]]; then
    rm -rf $i
    fi
    done


if [[ $action != "undo" ]]; then
    echo "linking local project"
    for i in $(echo $packages | tr ";" "\n")
    do
    ln -s "../../../../../fuselage/packages/$i" $i
    echo "apps/meteor $i"
    done
fi

cd ../../../../
if [[ $action == "undo" ]]; then
    yarn
fi

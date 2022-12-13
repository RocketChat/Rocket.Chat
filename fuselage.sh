#!/bin/bash

if [[ $1 == "--help" || $1 == "-h" ]]; then
    echo "Usage: fuselage.sh -a link|undo|next|latest -p fuselage;fuselage-icons"
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

if [[ $action != "link" && $action != "undo" && $action != 'next' && $action != 'latest' ]]; then
    echo "Invalid action"
    exit 1
fi


if [[ $action == "next" || $action == "latest" ]]; then
    eval "yarn up @rocket.chat/emitter@$action @rocket.chat/fuselage-polyfills@$action @rocket.chat/fuselage-toastbar@$action @rocket.chat/fuselage-tokens@$action @rocket.chat/fuselage-ui-kit@$action @rocket.chat/css-in-js@$action @rocket.chat/styled@$action @rocket.chat/fuselage@$action @rocket.chat/fuselage-hooks@$action @rocket.chat/icons@$action @rocket.chat/logo@$action @rocket.chat/memo@$action @rocket.chat/message-parser@$action @rocket.chat/onboarding-ui@$action @rocket.chat/string-helpers@$action @rocket.chat/ui-kit@$action @rocket.chat/layout@$action"
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

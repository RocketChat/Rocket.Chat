#!/bin/bash

if [[ $1 == "--help" || $1 == "-h" ]]; then
echo "==================================================================================================
Usage: yarn fuselage -a [action] -p [package]
Options:
-a | --action [link|undo|unlink|next|latest|next-all|latest-all]
    Specify the action to be performed by the script. This option accepts one of four arguments:
    - link        : Creates a symbolic link for the fuselage package
    - undo|unlink : Removes the symbolic li nk for the fuselage package
    - next        : Update dependencies with the @next npm package version
    - latest      : Update dependencies with the @latest npm package version
    - next-all    : Update ALL fuselage dependencies with the @next npm packages version
    - latest-all  : Update ALL fuselage dependencies with the @latest npm packages version

-p | --package [package1;package2]
    Specify the package where the symbolic link for the fuselage script should be created.
    This option can contain multiple packages separated by a semicolon (;).

Example usage:
- Create a symbolic link in multiple fuselage packages:
    yarn fuselage -a link -p fuselage;fuselage-icons;message-parser

- Remove the symbolic link:
    yarn fuselage -a undo

- Update dependencies to the @rocket.chat/fuselage@next npm package version
    yarn fuselage -a next -p fuselage

- Update dependencies to the @rocket.chat/fuselage@latest npm package version
    yarn fuselage -a latest -p fuselage

- Update ALL fuselage dependencies with the @next npm packages version:
    yarn fuselage -a next-all

- Update ALL fuselage dependencies with the @latest npm packages version:
    yarn fuselage -a latest-all
=================================================================================================="

    exit 1
fi

while getopts ":a:p:" opt; do
    case $opt in
    a)
        action="$OPTARG"
        ;;
    p)
        packages="$OPTARG"
        ;;
    \?)
        echo "Invalid option -$OPTARG" >&2
        echo "Run yarn fuselage --help for more information"
        exit 1
        ;;
    esac

    case $OPTARG in
    -*)
        echo "Option $opt needs a valid argument"
        echo "Run yarn fuselage --help for more information"
        exit 1
        ;;
    esac
done

action="${action:-link}"
packages="${packages:-fuselage}"

if [[ $action != "link" && $action != "undo" && $action != "unlink" && $action != 'next' && $action != 'next-all' && $action != 'latest' && $action != 'latest-all' ]]; then
    echo "Invalid action"
    echo "Run yarn fuselage --help for more information"
    exit 1
fi

if [[ $action == "next-all" || $action == "latest-all" ]]; then
    if [ "$action" = "next-all" ]; then
        targetVersion="next"
    else
        targetVersion="latest"
    fi

echo "📦 @rocket.chat/emitter [UPDATING to $targetVersion version...]
📦 @rocket.chat/fuselage-polyfills [UPDATING to $targetVersion version...]
📦 @rocket.chat/fuselage-toastbar [UPDATING to $targetVersion version...]
📦 @rocket.chat/fuselage-tokens [UPDATING to $targetVersion version...]
📦 @rocket.chat/css-in-js [UPDATING to $targetVersion version...]
📦 @rocket.chat/styled [UPDATING to $targetVersion version...]
📦 @rocket.chat/fuselage [UPDATING to $targetVersion version...]
📦 @rocket.chat/fuselage-hooks [UPDATING to $targetVersion version...]
📦 @rocket.chat/icons [UPDATING to $targetVersion version...]
📦 @rocket.chat/logo [UPDATING to $targetVersion version...]
📦 @rocket.chat/memo [UPDATING to $targetVersion version...]
📦 @rocket.chat/message-parser [UPDATING to $targetVersion version...]
📦 @rocket.chat/onboarding-ui [UPDATING to $targetVersion version...]
📦 @rocket.chat/string-helpers [UPDATING to $targetVersion version...]
📦 @rocket.chat/layout [UPDATING to $targetVersion version...]
📦 @rocket.chat/message-parser [UPDATING to $targetVersion version...]"

    eval "yarn up @rocket.chat/emitter@$targetVersion @rocket.chat/fuselage-polyfills@$targetVersion @rocket.chat/fuselage-toastbar@$targetVersion @rocket.chat/fuselage-tokens@$targetVersion @rocket.chat/css-in-js@$targetVersion @rocket.chat/styled@$targetVersion @rocket.chat/fuselage@$targetVersion @rocket.chat/fuselage-hooks@$targetVersion @rocket.chat/icons@$targetVersion @rocket.chat/logo@$targetVersion @rocket.chat/memo@$targetVersion @rocket.chat/message-parser@$targetVersion @rocket.chat/onboarding-ui@$targetVersion @rocket.chat/string-helpers@$targetVersion @rocket.chat/layout@$targetVersion @rocket.chat/message-parser@$targetVersion"
    exit 1
fi

if [[ $action == "next" || $action == "latest" ]]; then
    for i in $(echo $packages | tr ";" "\n"); do
        echo "Updating $i package to @rocket.chat/$i@$action ..."
        eval "yarn up @rocket.chat/$i@$action"
    done
    exit 1
fi


cd ./node_modules/@rocket.chat

for i in $(echo $packages | tr ";" "\n"); do
    rm -rf $i
    if [[ $action != "undo" && $action != "unlink" ]]; then
        ln -s "../../../fuselage/packages/$i" $i
    fi
done

cd ../..
cd ./apps/meteor/node_modules/@rocket.chat

for i in $(echo $packages | tr ";" "\n"); do
    if [[ $action != "undo" && $action != "unlink" ]]; then
        echo "Linking @rocket.chat/$i package to local project ..."
        rm -rf $i
        ln -s "../../../../../fuselage/packages/$i" $i
        echo "Local package @rocket.chat/$i linked successfully"
    else
        echo "Unlinking @rocket.chat/$i package to local project ..."
        rm -rf $i
        echo "Local package @rocket.chat/$i was unlinked successfully"
    fi
done

cd ../../../../
if [[ $action == "undo" || $action == "unlink" ]]; then
    yarn
fi

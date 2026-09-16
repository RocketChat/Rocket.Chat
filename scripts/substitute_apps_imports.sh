#!/bin/env zsh

emulate -L zsh

set -o xtrace

repoDir=$(dirname $(dirname ${0:a}))
workingDir="$repoDir/packages/apps"
baseRuntime="$workingDir/base-runtime"
nodeRuntime="$workingDir/node-runtime"

echo """
repoDir=$repoDir
workingDir=$workingDir
baseRuntime=$baseRuntime
nodeRuntime=$nodeRuntime
"""

local -a files=($baseRuntime/src/**/*.ts $nodeRuntime/src/**/*.ts)

for file in $files; do
	local importPath=$(realpath --relative-to="$(dirname "$file")" "$workingDir")
	sed -i -E "s|(^import.*)'@rocket.chat/apps/(.*)';$|\1'$importPath/\2';|g" $file
done

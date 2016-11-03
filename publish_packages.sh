#!/bin/bash
set -x
set -euvo pipefail
IFS=$'\n\t'

for d in packages/* ; do
  echo "$d"
  cd $d
  meteor publish
  cd ../../
done

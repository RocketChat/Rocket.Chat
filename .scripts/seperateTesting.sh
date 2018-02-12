#!/bin/bash
tmpPath=tests/end-to-end/temporary_staged_test
rm -rf $tmpPath
mkdir -p $tmpPath
for file in tests/end-to-end/*/*.js; do
  {
    set -x
    cp $file $tmpPath
 #   echo '--------- chimp-test '${file##*/}' ------------'
    CHIMP_PATH=$tmpPath meteor npm run chimp-path
    set +x
  } || {
    exit 1
  }
  rm $tmpPath/${file##*/}
done
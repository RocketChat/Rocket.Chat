#!/bin/bash
tmpPath=tests/end-to-end/temporary_staged_test
rm -rf $tmpPath
mkdir -p $tmpPath
[ -z "$num" ] && num=1
for file in tests/end-to-end/*/*.js; do
  
  failed=1
  for i in `seq 1 $num`; do
    echo '-------------- '$i' try ---------------'
    set -x
    cp $file $tmpPath
    CHIMP_PATH=$tmpPath meteor npm run chimp-path
    failed=$?
    set +x
    if [ $failed -eq 0 ]; then
      break
    fi
  done
  if [ $failed -ne 0 ]; then
    exit 1
  fi
  rm $tmpPath/${file##*/}
done
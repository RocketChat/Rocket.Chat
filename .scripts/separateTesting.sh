#!/bin/bash
tmpPath=tests/end-to-end/temporary_staged_test
rm -rf $tmpPath
mkdir -p $tmpPath
[ -z "$RETRY_TESTS" ] && RETRY_TESTS=1

paths=("tests/end-to-end/ui/*.js" "tests/end-to-end/ui_smarti/*.js")
for path in ${paths}; do

  for file in $path; do
    failed=1
    for i in `seq 1 $RETRY_TESTS`; do
      echo '-------------- '$i' try ---------------'
      set -x
      cp $file $tmpPath
      CHIMP_PATH=$tmpPath npm run chimp-path
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
done

#!/bin/bash
tmpPath=tests/end-to-end/temporary_staged_test
stopfile=`find ${tmpPath} -type f | head -1`
echo 'Last stop at:' $stopfile
[ -z "$retry_test" ] && retry_test=1
stopfile=`find ${tmpPath} -type f | head -1`
array=(`find tests/end-to-end/*/*.js -type f`)

for j in ${!array[@]}; do
  file=${array[$j]}
  [[ ${stopfile##*/} == ${file##*/} ]] && [[ $stopfile != $file ]] && break
done

rm -rf $tmpPath
mkdir -p $tmpPath
for file in ${array[@]:$j}; do
  failed=1
  for i in `seq 1 $retry_test`; do
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
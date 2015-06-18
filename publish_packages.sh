for d in packages/* ; do
  echo "$d"
  cd $d
  meteor publish
  cd ../../
done
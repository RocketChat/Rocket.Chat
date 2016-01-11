if [[ $TRAVIS_TAG ]]
 then
  export ARTIFACT_NAME="$TRAVIS_TAG";
else
  export ARTIFACT_NAME="develop";
fi

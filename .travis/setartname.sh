if [[ $TRAVIS_TAG ]]
 then
  export ARTIFACT_NAME="$(meteor npm run version --silent)"
else
  export ARTIFACT_NAME="$(meteor npm run version --silent).$TRAVIS_BUILD_NUMBER"
fi

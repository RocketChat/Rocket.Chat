if [[ $TRAVIS_BRANCH ]]
 then
  export ARTIFACT_NAME="$(meteor npm run version --silent).$TRAVIS_BUILD_NUMBER"
else
  export ARTIFACT_NAME="$(meteor npm run version --silent)"
fi

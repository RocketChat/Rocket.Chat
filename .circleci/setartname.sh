if [[ $CIRCLE_TAG ]]
 then
  export ARTIFACT_NAME="$(npm run version --silent)"
else
  export ARTIFACT_NAME="$(npm run version --silent).$CIRCLE_BUILD_NUM"
fi

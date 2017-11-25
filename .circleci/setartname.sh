if [[ $CIRCLE_TAG ]]; then
  export ARTIFACT_NAME="$(npm run version --silent)"
else
  export ARTIFACT_NAME="$(npm run version --silent).$CIRCLE_BUILD_NUM"
fi

if [[ $CIRCLE_TAG =~ ^[0-9]+\.[0-9]+\.[0-9]+-rc\.[0-9]+ ]]; then
  SNAP_CHANNEL=candidate
  RC_RELEASE=candidate
  RC_VERSION=$CIRCLE_TAG
elif [[ $CIRCLE_TAG =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  SNAP_CHANNEL=stable
  RC_RELEASE=stable
  RC_VERSION=$CIRCLE_TAG
else
  SNAP_CHANNEL=edge
  RC_RELEASE=develop
  RC_VERSION=0.60.0-develop
fi

export SNAP_CHANNEL
export RC_RELEASE
export RC_VERSION

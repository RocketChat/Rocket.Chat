if [[ $CIRCLE_TAG ]]
 then
  export ARTIFACT_NAME="$(npm run version --silent)"
else
  export ARTIFACT_NAME="$(npm run version --silent).circleci-$CIRCLE_BUILD_NUM"
fi

# Determine the channel to push snap to.
SNAP_CHANNEL=edge
RC_VERSION=0.59.0-develop

if [[ "${CIRCLE_TAG+SET}" = "SET" ]]; then
    if [[ $CIRCLE_TAG =~ ^[0-9]+\.[0-9]+\.[0-9]+-rc\.[0-9]+ ]]; then
        SNAP_CHANNEL=candidate
        RC_VERSION=$CIRCLE_TAG
    elif [[ $CIRCLE_TAG =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        SNAP_CHANNEL=stable
        RC_VERSION=$CIRCLE_TAG
    fi
fi

export SNAP_CHANNEL
export RC_VERSION

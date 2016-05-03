#!/bin/sh
echo "Loading Learners Guild Environment"
export APP_BASEURL ROOT_URL JWT_PUBLIC_KEY
source .env
echo "Starting Meteor"
meteor

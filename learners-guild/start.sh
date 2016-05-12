#!/bin/sh
echo "Loading Learners Guild Environment"
source .env
for var in `cat .env | grep = | cut -f1 -d=`
do
  export "$var"
done
echo "Starting Meteor"

meteor

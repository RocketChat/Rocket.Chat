#!/bin/bash

stack=$1
app=$2

id=`aws opsworks create-deployment --stack-id $stack --app-id $app --command Name=deploy | grep Deployment | sed 's/.*: "\(.*\)".*/\1/'`
if [ -z "$id" ]; then
  exit 1
fi
while aws opsworks describe-deployments --deployment-id $id | grep running; do
  sleep 10;
done
aws opsworks describe-deployments --deployment-id $id
if aws opsworks describe-deployments --deployment-id $id | grep failed; then
  exit 1
fi

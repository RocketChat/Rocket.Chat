#!/bin/bash

DATETIME=`date "+%d/%m/%Y %H:%M:%S"`
COMMIT_HASH=`git log --pretty=format:'%H' -n 1`
COMMIT_AUTHOR_NAME=`git log --pretty=format:'%an' -n 1`
COMMIT_AUTHOR_DATE=`git log --pretty=format:'%ad' -n 1`
COMMIT_AUTHOR_EMAIL=`git log --pretty=format:'%ae' -n 1`
COMMIT_SUBJECT=`git log --pretty=format:'%s' -n 1`

COMMIT_SUBJECT="${COMMIT_SUBJECT//\'/\"}"

echo "BuildInfo = {
	date: '$DATETIME',
	commit: {
		hash: '$COMMIT_HASH',
		subject: '$COMMIT_SUBJECT',
		author: {
			date: '$COMMIT_AUTHOR_DATE',
			name: '$COMMIT_AUTHOR_NAME',
			email: '$COMMIT_AUTHOR_EMAIL'
		}
	}
};" > ./BuildInfo.js

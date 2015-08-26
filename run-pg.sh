#! /bin/sh
echo "Make sure you have created a DB called 'rocketchat', and that you have run the migrations in .knex/"
export POSTGRESQL_URL="postgres://127.0.0.1/rocketchat"
export MONGO_URL="nope"

cd "$(dirname $0)"

meteor "$@"

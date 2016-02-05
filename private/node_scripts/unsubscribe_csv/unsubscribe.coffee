_ = require 'underscore'

fs = require('fs')
lineReader = require('line-reader')
moment = require('moment')
path = require('path')
program = require('commander')
wait = require('wait.for')

MongoClient = require('mongodb').MongoClient

program
	.usage '[options]'
	.option '-v, --verbose', 'Verbose', ((v, total) -> total + 1), 0
	.option '-M, --mongo-db [mongo db]', 'Mongo DB', 'localhost:27017'
	.option '-N, --db-name [db name]', 'DB Name', 'meteor'
	.on '--help', ->
		console.log '  Example:'
		console.log ''
		console.log '    $ coffee unsubscribe.coffee'
		console.log ''
	.parse process.argv

wait.launchFiber ->
	db = wait.forMethod MongoClient, 'connect', "mongodb://#{program.mongoDb}/#{program.dbName}", { replSet: { socketOptions: { connectTimeoutMS: 300000 } } }
	User = db.collection 'users'
	lineReader.eachLine './unsubscribe.csv', (line, last) ->
		row = line.split ','
		console.log row[0] if program.verbose
		wait.launchFiber ->
			updated = wait.forMethod User, 'update', { "emails.address": row[0] }, { $set: { "mailer.unsubscribed": true } }
			if last
				process.exit()

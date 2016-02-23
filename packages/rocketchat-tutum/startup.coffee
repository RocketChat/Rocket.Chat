### Examples

TUTUM_REDIS_HOST=redis://:password@host:6379
TUTUM_CLIENT_NAME=mywebsite
TUTUM_CLIENT_HOST=mywebsite.dotcloud.com
###

if process.env.TUTUM_REDIS_HOST?
	redis = Npm.require 'redis'

	client = redis.createClient(process.env.TUTUM_REDIS_HOST)

	client.del("frontend:#{process.env.TUTUM_CLIENT_HOST}")
	client.rpush("frontend:#{process.env.TUTUM_CLIENT_HOST}", process.env.TUTUM_CLIENT_NAME)
	client.rpush("frontend:#{process.env.TUTUM_CLIENT_HOST}", "http://#{process.env.TUTUM_IP_ADDRESS.split('/')[0]}:3000")

	# removes the redis entry on a SIGTERM
	process.on 'SIGTERM', ->
		client.del("frontend:#{process.env.TUTUM_CLIENT_HOST}")

	day = 86400000

	inactiveDays = 30

	if not isNaN(parseInt(process.env.TUTUM_REDIS_INACTIVE_DAYS))
		inactiveDays = parseInt(process.env.TUTUM_REDIS_INACTIVE_DAYS)

	terminateAppIfInactive = ->
		subscription = RocketChat.models.Subscriptions.findOne({ls: {$exists: true}}, {sort: {ls: -1}, fields: {ls: 1}})

		if not subscription? or Date.now() - subscription.ls > inactiveDays * day
			client.del("frontend:#{process.env.TUTUM_CLIENT_HOST}")
			process.exit 0

	Meteor.setInterval ->
		now = new Date()
		if now.getHours() is 4 and now.getMinutes() is 0
			terminateAppIfInactive()
	, 60000

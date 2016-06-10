### Examples

DOCKERCLOUD_REDIS_HOST=redis://:password@host:6379
DOCKERCLOUD_CLIENT_NAME=mywebsite
DOCKERCLOUD_CLIENT_HOST=mywebsite.dotcloud.com
###

if process.env.DOCKERCLOUD_REDIS_HOST?
	redis = Npm.require 'redis'

	client = redis.createClient(process.env.DOCKERCLOUD_REDIS_HOST)
	client.del("frontend:#{process.env.DOCKERCLOUD_CLIENT_HOST}")
	client.rpush("frontend:#{process.env.DOCKERCLOUD_CLIENT_HOST}", process.env.DOCKERCLOUD_CLIENT_NAME)
	client.rpush("frontend:#{process.env.DOCKERCLOUD_CLIENT_HOST}", "http://#{process.env.DOCKERCLOUD_IP_ADDRESS.split('/')[0]}:3000")
	client.quit()

	# removes the redis entry in 90 seconds on a SIGTERM
	process.on 'SIGTERM', ->
		client = redis.createClient(process.env.DOCKERCLOUD_REDIS_HOST)
		client.expire("frontend:#{process.env.DOCKERCLOUD_CLIENT_HOST}", 90)
		client.quit()

	day = 86400000

	inactiveDays = 30

	if not isNaN(parseInt(process.env.DOCKERCLOUD_REDIS_INACTIVE_DAYS))
		inactiveDays = parseInt(process.env.DOCKERCLOUD_REDIS_INACTIVE_DAYS)

	terminateAppIfInactive = ->
		subscription = RocketChat.models.Subscriptions.findOne({ls: {$exists: true}}, {sort: {ls: -1}, fields: {ls: 1}})

		if not subscription? or Date.now() - subscription.ls > inactiveDays * day
			client = redis.createClient(process.env.DOCKERCLOUD_REDIS_HOST)
			client.del("frontend:#{process.env.DOCKERCLOUD_CLIENT_HOST}")
			client.quit()
			process.exit 0

	Meteor.setInterval ->
		now = new Date()
		if now.getHours() is 4 and now.getMinutes() is 0
			terminateAppIfInactive()
	, 60000

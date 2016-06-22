### Examples

DOCKERCLOUD_REDIS_HOST=redis://:password@host:6379
DOCKERCLOUD_CLIENT_NAME=mywebsite
DOCKERCLOUD_CLIENT_HOST=mywebsite.dotcloud.com
###

if process.env.DOCKERCLOUD_REDIS_HOST?
	redis = Npm.require 'redis'

	client = redis.createClient(process.env.DOCKERCLOUD_REDIS_HOST)

	client.on 'error', (err) ->
		console.log 'Redis error ->', err

	client.del("frontend:#{process.env.DOCKERCLOUD_CLIENT_HOST}")
	client.rpush("frontend:#{process.env.DOCKERCLOUD_CLIENT_HOST}", process.env.DOCKERCLOUD_CLIENT_NAME)

	port = process.env.PORT || 3000
	client.rpush("frontend:#{process.env.DOCKERCLOUD_CLIENT_HOST}", "http://#{process.env.DOCKERCLOUD_IP_ADDRESS.split('/')[0]}:#{port}")

	# removes the redis entry in 90 seconds on a SIGTERM
	process.on 'SIGTERM', ->
		client.expire("frontend:#{process.env.DOCKERCLOUD_CLIENT_HOST}", 90)

	process.on 'SIGINT', ->
		client.expire("frontend:#{process.env.DOCKERCLOUD_CLIENT_HOST}", 90)

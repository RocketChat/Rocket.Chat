### Examples

TUTUM_REDIS_HOST=127.0.0.1
TUTUM_REDIS_PORT=6379
TUTUM_CLIENT_NAME=mywebsite
TUTUM_CLIENT_HOST=mywebsite.dotcloud.com
###

if process.env.TUTUM_REDIS_HOST? and process.env.TUTUM_CONTAINER_API_URL?
	redis = Npm.require 'redis'

	process.env.TUTUM_REDIS_PORT ?= 6379

	client = redis.createClient(process.env.TUTUM_REDIS_PORT, process.env.TUTUM_REDIS_HOST)

	client.del("frontend:#{process.env.TUTUM_CLIENT_HOST}")
	client.rpush('frontend:#{process.env.TUTUM_CLIENT_HOST}', process.env.TUTUM_CLIENT_NAME)
	client.rpush('frontend:#{process.env.TUTUM_CLIENT_HOST}', "http://#{process.env.TUTUM_IP_ADDRESS.split('/')[0]}:3000")

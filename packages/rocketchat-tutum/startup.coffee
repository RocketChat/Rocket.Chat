### Examples

TUTUM_REDIS_HOST=127.0.0.1
TUTUM_REDIS_PORT=6379
TUTUM_CLIENT_HOST=mywebsite
TUTUM_CLIENT_NAME=www.dotcloud.com
TUTUM_CLIENT_ADDRESS=http://192.168.0.42:80
###

if process.env.TUTUM_REDIS_HOST?
	redis = Npm.require 'redis'

	process.env.TUTUM_REDIS_PORT ?= 6379

	client = redis.createClient(process.env.TUTUM_REDIS_PORT, process.env.TUTUM_REDIS_HOST)

	client.del("frontend:#{process.env.TUTUM_CLIENT_HOST}")
	client.rpush('frontend:#{process.env.TUTUM_CLIENT_HOST}', process.env.TUTUM_CLIENT_NAME)
	client.rpush('frontend:#{process.env.TUTUM_CLIENT_HOST}', process.env.TUTUM_CLIENT_ADDRESS)

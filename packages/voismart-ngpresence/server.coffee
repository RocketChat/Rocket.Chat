crypto = Npm.require 'crypto'

class AmqpConnection
	currentTry: 0
	stopTrying: false

	constructor: ({@host, @vhost, @user, @password, @exclusiveQueue, @routingKey, @exchange, @queuePrefix}) ->
		@exclusiveQueue = @exclusiveQueue or false
		@exchange = @exchange or 'eventbus'
		@queuePrefix = @queuePrefix or ''
		@url = "amqp://#{@user}:#{@password}@#{@host}/#{@vhost}?heartbeat=30"

	connect: ->
		@currentTry += 1
		@stopTrying = false
		console.log('connecting to', "amqp://#{@host}/#{@vhost}")
		amqpClient.connect(@url).then(@onConnected, @onError)

	onConnected: (conn) =>
		@currentTry = 0
		@conn = conn
		conn.on('error', @reconnect)
		conn.createChannel().then(@onChannelCreated, @onError)

	reconnect: =>
		attempt = if @currentTry > 0 then @currentTry else 0
		random_delay = Math.floor(Math.random() * (30 - 1)) + 1
		max_delay = 120
		delay = Math.min(random_delay + Math.pow(2, attempt-1), max_delay)
		console.log('disconnected. Attempt', attempt, 'Trying reconnect in ', delay, 'seconds')
		setTimeout((=> @connect(@url)), delay * 1000)

	onError: (e) =>
		console.log('error', e)
		if @conn
			@conn.close()
			@conn = null
			@chan = null
			@qid = null
		@reconnect(e)

	disconnect: =>
		@stopTrying = true
		if @conn
			console.log("disconnecting from amqp host #{@host}")
			@conn.close()
			@conn = null
			@chan = null
			@qid = null

	onChannelCreated: (chan) =>
		@chan = chan
		chan.assertExchange(@exchange, 'topic', {durable: false}).then(@declareQueue)

	declareQueue: =>
		queueopts =
			autoDelete: true,
			durable: false,
			'arguments': 'x-message-ttl': 0
		if @exclusiveQueue
			queueopts['exclusive'] = true
			qid = Random.id(32)
		else
			queueopts['exclusive'] = false
			qid = crypto.hex_md5(@queuePrefix + @routingKey)
		@qid = qid
		ok = @chan.assertQueue(qid, queueopts)
		ok = ok.then(=> @chan.bindQueue(@qid, @exchange, @routingKey))
		ok = ok.then(=> @chan.consume(@qid, @onMessage))

	onMessage: (msg) =>
		payload = JSON.parse(msg.content.toString('utf8'))['payload']
		console.log('received', payload)

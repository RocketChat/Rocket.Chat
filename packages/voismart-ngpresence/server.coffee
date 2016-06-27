crypto = Npm.require 'crypto'

logger = new Logger 'NGPresence'


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
		logger.info("connecting to amqp://#{@host}/#{@vhost}")
		amqpClient.connect(@url).then(@onConnected, @onError)

	onConnected: (conn) =>
		@currentTry = 0
		@conn = conn
		conn.on 'error', @reconnect
		conn.createChannel().then(@onChannelCreated, @onError)

	reconnect: =>
		attempt = if @currentTry > 0 then @currentTry else 0
		random_delay = Math.floor(Math.random() * (30 - 1)) + 1
		max_delay = 120
		delay = Math.min(random_delay + Math.pow(2, attempt-1), max_delay)
		logger.warn "disconnected. Attempt #{attempt}. Trying reconnect in #{delay}s"
		setTimeout (=> @connect(@url)), delay * 1000

	onError: (e) =>
		logger.error('error', e)
		if @conn
			@conn.close()
			@conn = null
			@chan = null
			@qid = null
		@reconnect(e)

	disconnect: =>
		@stopTrying = true
		if @conn
			logger.info "disconnecting from amqp host #{@host}"
			@conn.close()
			@conn = null
			@chan = null
			@qid = null

	onChannelCreated: (chan) =>
		@chan = chan
		chan.assertExchange(@exchange, 'topic', durable: false).then(@declareQueue)

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
			qid = CryptoJS.MD5(@queuePrefix + @routingKey).toString()
		@qid = qid
		ok = @chan.assertQueue(qid, queueopts)
		ok = ok.then(=> @chan.bindQueue(@qid, @exchange, @routingKey))
		ok = ok.then(=> @chan.consume(@qid, @onMessage))

	onMessage: (msg) =>
		payload = JSON.parse(msg.content.toString('utf8'))['payload']
		logger.debug "received", payload

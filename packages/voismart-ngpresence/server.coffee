crypto = Npm.require 'crypto'

logger = new Logger 'NGPresence'


class AmqpConnection
	currentTry: 0
	stopTrying: false

	constructor: ({@host, @vhost, @user, @password, @exclusiveQueue, @routingKey, @exchange, @queuePrefix, @callback}) ->
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
		@conn?.close()
		attempt = if @currentTry > 0 then @currentTry else 0
		random_delay = Math.floor(Math.random() * (30 - 1)) + 1
		max_delay = 120
		delay = Math.min(random_delay + Math.pow(2, attempt-1), max_delay)
		logger.warn "disconnected. Attempt #{attempt}. Trying reconnect in #{delay}s"
		setTimeout (=> @connect(@url)), delay * 1000

	onError: (e) =>
		logger.error('error', e)
		if @conn
			try
				@conn.close()
			catch e
				# just ignore close errors: https://github.com/squaremo/amqp.node/issues/111#issuecomment-69464994
				undefined
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
		ok = ok.then(=> @chan.consume(@qid, @onMessage, {noAck: true}))

	onMessage: (msg) =>
		try
			payload = JSON.parse(msg.content.toString('utf8'))['payload']
			logger.debug "received", payload
			mtype = payload['type']
			switch mtype
				when 'update', 'solicited', 'unsolicited'
					@onUpdateMessage payload.user_statuses
				when 'probe'
					# do nothing but do not clutter logs
				else logger.warn "unknown type #{mtype}"
		catch e
			logger.error "ignoring message. Got error: ", e
			logger.warn e.stack

	onUpdateMessage: (statuses) =>
		for status in statuses
			resources = (r for r in status['resources'] when r.type == 'webchat')
			@callback status.user, status['status_webchat_policy'], resources


class PresenceManager
	presmapper:
		DND: 'busy'
		AWAY: 'away'
		EXTAWAY: 'away'
		CHAT: 'online'
		AVAILABLE: 'online'
		INVISIBLE: 'offline'
		OFFLINE: 'offline'
		UNKNOWN: 'offline'

	default_status: 'offline'

	constructor: (presenceClient) ->
		@presenceClient = presenceClient

	setPresence: (username, status, resources) =>
		user = RocketChat.models.Users.findOneByUsername username
		if not user
			logger.warn "no such user: #{username}"
			return
		mapped_status = @presmapper[status] or @default_status
		if user.statusConnection == "offline" and mapped_status != "offline" and resources.length > 0
			# this user is not connected, publish back his status
			# (maybe the client disconnected while the presence server was
			# down)
			logger.info "#{username} is offline, not #{mapped_status}. Publishing offline"
			@presenceClient.publishPresence(user, "offline", user.statusConnection)
			return
		else if user.statusConnection != "offline"
			# only set status if we aren't offline
			# e.g. if aggregated status is dnd because of a call, do not update
			#      chat status unless we have a user connection
			logger.info "setting status for #{username} to #{mapped_status}"
			Meteor.users.update({_id: user._id, status: {$ne: mapped_status}}, {$set: {status: mapped_status}})


class PresenceClient
	presmapper:
		busy: 'DND'
		away: 'AWAY'
		online: 'AVAILABLE'
		offline: 'OFFLINE'

	constructor: ({@host, @user, @password, @vhost, @domain, @domain_id}) ->
		@url = "amqp://#{@user}:#{@password}@#{@host}/#{@vhost}?heartbeat=30"
		@connection = null
		@client = null
		@connected = false
		@sendQueue = []

	connect: ->
		tamqp = Npm.require 'node-thrift-amqp'
		opts =
			servicesExchange: "servicesExchange",
			responsesExchange: "responsesExchange",
			routingKey: "presenceHandler"
			logger: logger
		connection = tamqp.createConnection @url, opts
		presenceService = Npm.require('node-ydin-presence-service').presenceService
		connection.connect (err, conn) =>
			if err
				logger.error "cannot connect thrift-amqp client: #{err}"
				@connected = false
				return

			@connection = conn
			try
				@client = tamqp.createClient presenceService, connection
				@client.request_initial_status @domain_id, null, (err, res) ->
					if err
						logger.error "error: #{err}"
						conn.close()
				@connected = true

				# flush sendQueue
				for el in @sendQueue
					@publishPresence el[0], el[1], el[2]
				@sendQueue = []
			catch e
				logger.error "catched error: #{e}"
				conn.close()

		connection.on "error", (err) ->
			logger.error "thrift-amqp connection error: #{err}"

	publishPresence: (user, status, statusConnection) =>
		if user.status == status
			return
		if not @connected
			logger.error('not connected, publishing to sendqueue', user, status)
			@sendQueue.push([user, status, statusConnection])
			return

		pTypes = Npm.require('node-ydin-presence-service').presenceServiceTypes
		status = @presmapper[status] or 'UNKNOWN'
		i = new pTypes.TXmppEvent(
					user: user.username,
					domain: @domain,
					name: "PRESENCE",
					resource: "webchat",
					status: status,
					presence_source: "webchat" )
		logger.info "publishing presence for #{user.username} to #{status}"
		@client.publish_webchat_presence i, @_logErrors

	_logErrors: (err, res) ->
		if err
			logger.error "presence client got error: #{err}"


_retry = new Retry
	baseTimeout: 5000
	maxTimeout: 30000

_count = 0


_do_startup = ->
	broker_host = RocketChat.settings.get('OrchestraIntegration_BrokerHost')
	broker_user = RocketChat.settings.get('OrchestraIntegration_BrokerUser')
	broker_password = RocketChat.settings.get('OrchestraIntegration_BrokerPassword')
	if not (broker_host and broker_user and broker_password)
		logger.error('no broker credentials supplied')
		return

	ng_host = RocketChat.settings.get('OrchestraIntegration_Server')
	ng_user = RocketChat.settings.get('OrchestraIntegration_APIUser')
	ng_passwd = RocketChat.settings.get('OrchestraIntegration_APIPassword')
	ng_domain = RocketChat.settings.get('OrchestraIntegration_Domain')
	ng = new NGApi(ng_host)
	try
		if ng_user and ng_passwd
			# use username/password login
			res = ng.login "#{ng_user}@#{ng_domain}", ng_passwd
		else if ng_user
			# use trusted auth
			res = ng.trustedLogin "#{ng_user}@#{ng_domain}"
		else
			logger.error('no credentials supplied')
			return

		token = res.token
		if not (res and res.token)
			logger.error "invalid response from server: #{res}"
			return

		user = ng.getUser token
		if user.success is false
			logger.error "invalid user"
			return
		domain_id = user.domain_id
	catch e
		logger.error "error getting domain: \"#{e}\""
		_retry.retryLater ++_count, _do_startup
		return

	pclient = new PresenceClient
		host: broker_host
		user: broker_user
		password: broker_password
		vhost: '/ydin'
		domain_id: domain_id
		domain: ng_domain
	pclient.connect()

	pm = new PresenceManager(pclient)
	c = new AmqpConnection
		host: broker_host
		vhost: '/ydin_evb'
		user: broker_user
		password: broker_password
		exclusiveQueue: false
		routingKey: "ydin.presence.event.#{domain_id}"
		callback: Meteor.bindEnvironment(pm.setPresence)
	c.connect()

	# add our own callback on user presence set
	UserPresenceMonitor.onSetUserStatus(pclient.publishPresence)


Meteor.startup ->
	if not RocketChat.settings.get('OrchestraIntegration_PresenceEnabled')
		return

	_do_startup()

@LoggerManager = new class extends EventEmitter
	constructor: ->
		@enabled = false
		@loggers = {}
		@queue = []

		@showPackage = false
		@showFileAndLine = false
		@logLevel = 0

	register: (logger) ->
		if not logger instanceof Logger
			return

		@loggers[logger.name] = logger

		@emit 'register', logger

	addToQueue: (logger, args)->
		@queue.push
			logger: logger
			args: args

	dispatchQueue: ->
		for item in @queue
			item.logger._log.apply item.logger, item.args

		@clearQueue()

	clearQueue: ->
		@queue = []

	disable: ->
		@enabled = false

	enable: (dispatchQueue=false) ->
		@enabled = true
		if dispatchQueue is true
			@dispatchQueue()
		else
			@clearQueue()


# @LoggerManager.on 'register', ->
# 	console.log('on register', arguments)


@Logger = class Logger
	defaultTypes:
		debug:
			name: 'debug'
			color: 'blue'
			level: 2
		log:
			name: 'info'
			color: 'blue'
			level: 1
		info:
			name: 'info'
			color: 'blue'
			level: 1
		warn:
			name: 'warn'
			color: 'magenta'
			level: 1
		error:
			name: 'error'
			color: 'red'
			level: 0

	constructor: (@name, config={}) ->
		@config = {}

		_.extend @config, config

		if LoggerManager.loggers[@name]?
			LoggerManager.loggers[@name].warn 'Duplicated instance'
			return LoggerManager.loggers[@name]

		for type, typeConfig of @defaultTypes
			do (type, typeConfig) =>
				@[type] = (args...) =>
					@_log
						type: type
						level: typeConfig.level
						method: typeConfig.name
						arguments: args

		if @config.methods?
			for method, typeConfig of @config.methods
				do (method, typeConfig) =>
					if @[method]?
						@warn "Method", method, "already exists"

					if not @defaultTypes[typeConfig.type]?
						@warn "Method type", typeConfig.type, "doest not exists"

					@[method] = (args...) =>
						@_log
							type: typeConfig.type
							level: if typeConfig.level? then typeConfig.level? else @defaultTypes[typeConfig.type]?.level
							method: method
							arguments: args

		LoggerManager.register @
		return @

	getPrefix: (options) ->
		prefix = "#{@name} ➔ #{options.method}"

		details = @_getCallerDetails()

		detailParts = []
		if details.package? and (LoggerManager.showPackage is true or options.type is 'error')
			detailParts.push details.package

		if LoggerManager.showFileAndLine is true or options.type is 'error'
			if details.file? and details.line?
				detailParts.push "#{details.file}:#{details.line}"
			else
				if details.file?
					detailParts.push details.file
				if details.line?
					detailParts.push details.line

		if @defaultTypes[options.type]?
			prefix = prefix[@defaultTypes[options.type].color]

		if detailParts.length > 0
			prefix = "#{detailParts.join(' ')} #{prefix}"

		return prefix

	# @returns {Object: { line: Number, file: String }}
	_getCallerDetails: ->
		getStack = () ->
			# We do NOT use Error.prepareStackTrace here (a V8 extension that gets us a
			# pre-parsed stack) since it's impossible to compose it with the use of
			# Error.prepareStackTrace used on the server for source maps.
			err = new Error
			stack = err.stack
			return stack

		stack = getStack()

		if not stack
			return {}

		lines = stack.split('\n')

		# looking for the first line outside the logging package (or an
		# eval if we find that first)
		line = undefined
		for item, index in lines when index > 0
			line = item
			if line.match(/^\s*at eval \(eval/)
				return {file: "eval"}

			if not line.match(/packages\/rocketchat_logger(?:\/|\.js)/)
				break

		details = {}

		# The format for FF is 'functionName@filePath:lineNumber'
		# The format for V8 is 'functionName (packages/logging/logging.js:81)' or
		#                      'packages/logging/logging.js:81'
		match = /(?:[@(]| at )([^(]+?):([0-9:]+)(?:\)|$)/.exec(line)
		if not match
			return details
		# in case the matched block here is line:column
		details.line = match[2].split(':')[0]

		# Possible format: https://foo.bar.com/scripts/file.js?random=foobar
		# XXX: if you can write the following in better way, please do it
		# XXX: what about evals?
		details.file = match[1].split('/').slice(-1)[0].split('?')[0]

		packageMatch = match[1].match(/packages\/([^\.\/]+)(?:\/|\.)/)
		if packageMatch?
			details.package = packageMatch[1]

		return details

	_log: (options) ->
		if LoggerManager.enabled is false
			LoggerManager.addToQueue @, arguments
			return

		options.level ?= 1

		if LoggerManager.logLevel < options.level
			return

		options.arguments.unshift @getPrefix(options)
		console.log.apply console, options.arguments

# Meteor.publish 'stdout', ->
# 	write = process.stdout.write
# 	process.stdout.write = (string, encoding, fd) =>
# 		write.apply(process.stdout, arguments)
# 		id = Random.id()
# 		@added 'stdout', id, {string: string}
# 		@removed 'stdout', id

# 	@ready()

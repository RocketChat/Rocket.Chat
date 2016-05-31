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
		success:
			name: 'info'
			color: 'green'
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
		self = @
		@config = {}

		_.extend @config, config

		if LoggerManager.loggers[@name]?
			LoggerManager.loggers[@name].warn 'Duplicated instance'
			return LoggerManager.loggers[@name]

		for type, typeConfig of @defaultTypes
			do (type, typeConfig) ->
				self[type] = (args...) ->
					self._log.call self,
						section: this.__section
						type: type
						level: typeConfig.level
						method: typeConfig.name
						arguments: args

				self[type+"_box"] = (args...) ->
					self._log.call self,
						section: this.__section
						type: type
						box: true
						level: typeConfig.level
						method: typeConfig.name
						arguments: args

		if @config.methods?
			for method, typeConfig of @config.methods
				do (method, typeConfig) ->
					if self[method]?
						self.warn "Method", method, "already exists"

					if not self.defaultTypes[typeConfig.type]?
						self.warn "Method type", typeConfig.type, "does not exist"

					self[method] = (args...) ->
						self._log.call self,
							section: this.__section
							type: typeConfig.type
							level: if typeConfig.level? then typeConfig.level else self.defaultTypes[typeConfig.type]?.level
							method: method
							arguments: args

					self[method+"_box"] = (args...) ->
						self._log.call self,
							section: this.__section
							type: typeConfig.type
							box: true
							level: if typeConfig.level? then typeConfig.level else self.defaultTypes[typeConfig.type]?.level
							method: method
							arguments: args

		if @config.sections?
			for section, name of @config.sections
				do (section, name) ->
					self[section] = {}
					for type, typeConfig of self.defaultTypes
						do (type, typeConfig) =>
							self[section][type] = =>
								self[type].apply {__section: name}, arguments

							self[section][type+"_box"] = =>
								self[type+"_box"].apply {__section: name}, arguments

					for method, typeConfig of self.config.methods
						do (method, typeConfig) =>
							self[section][method] = =>
								self[method].apply {__section: name}, arguments

							self[section][method+"_box"] = =>
								self[method+"_box"].apply {__section: name}, arguments

		LoggerManager.register @
		return @

	getPrefix: (options) ->
		if options.section?
			prefix = "#{@name} ➔ #{options.section}.#{options.method}"
		else
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

	makeABox: (message, title) ->
		if not _.isArray(message)
			message = message.split("\n")

		len = 0
		for line in message
			len = Math.max(len, line.length)

		topLine = "+--" + s.pad('', len, '-') + "--+"
		separator = "|  " + s.pad('', len, '') + "  |"
		lines = []

		lines.push topLine
		if title?
			lines.push "|  " + s.lrpad(title, len) + "  |"
			lines.push topLine

		lines.push separator

		for line in message
			lines.push "|  " + s.rpad(line, len) + "  |"

		lines.push separator
		lines.push topLine
		return lines


	_log: (options) ->
		if LoggerManager.enabled is false
			LoggerManager.addToQueue @, arguments
			return

		options.level ?= 1

		if LoggerManager.logLevel < options.level
			return

		prefix = @getPrefix(options)

		if options.box is true and _.isString(options.arguments[0])
			color = undefined
			if @defaultTypes[options.type]?
				color = @defaultTypes[options.type].color

			box = @makeABox options.arguments[0], options.arguments[1]
			subPrefix = '➔'
			if color?
				subPrefix = subPrefix[color]

			console.log subPrefix, prefix
			for line in box
				if color?
					console.log subPrefix, line[color]
				else
					console.log subPrefix, line
		else
			options.arguments.unshift prefix
			console.log.apply console, options.arguments

		return


@SystemLogger = new Logger 'System',
	methods:
		startup:
			type: 'success'
			level: 0


processString = (string, date) ->
	if string[0] is '{'
		try
			return Log.format EJSON.parse(string), {color: true}

	try
		return Log.format {message: string, time: date, level: 'info'}, {color: true}

	return string

StdOut = new class extends EventEmitter
	constructor: ->
		@queue = []
		write = process.stdout.write
		process.stdout.write = (string, encoding, fd) =>
			write.apply(process.stdout, arguments)
			date = new Date
			string = processString string, date

			item =
				id: Random.id()
				string: string
				ts: date

			@queue.push item

			if RocketChat?.settings?.get('Log_View_Limit')? and @queue.length > RocketChat.settings.get('Log_View_Limit')
				@queue.shift()

			@emit 'write', string, item


Meteor.publish 'stdout', ->
	unless @userId
		return @ready()

	if RocketChat.authz.hasPermission(@userId, 'view-logs') isnt true
		return @ready()

	for item in StdOut.queue
		@added 'stdout', item.id,
			string: item.string
			ts: item.ts

	@ready()

	StdOut.on 'write', (string, item) =>
		@added 'stdout', item.id,
			string: item.string
			ts: item.ts

	return

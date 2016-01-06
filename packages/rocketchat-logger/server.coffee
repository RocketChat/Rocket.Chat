LoggerManager = new class
	loggers: {}

@Logger = class Logger
	defaultTypes:
		log: 'blue'
		warn: 'magenta'
		error: 'red'

	constructor: (@name, @config={}) ->
		if LoggerManager.loggers[@name]?
			LoggerManager.loggers[@name].warn 'Duplicated instance'
			return LoggerManager.loggers[@name]

		for type, color of @defaultTypes
			do (type, color) =>
				@[type] = (args...) =>
					@_log
						type: type
						arguments: args

		if @config.methods?
			for method, type of @config.methods
				do (method, type) =>
					if @[method]?
						@warn "Method", method, "already exists"

					if not @defaultTypes[type]?
						@warn "Method type", type, "doest not exists"

					@[method] = (args...) =>
						@_log
							type: type
							method: method
							arguments: args

		return @

	getPrefix: (options) ->
		prefix = ""

		if options.method?
			prefix = "[#{@name}->#{options.method}]"
		else
			prefix = "[#{@name}]"

		details = @_getCallerDetails()

		detailParts = []
		if details.package? then detailParts.push details.package
		if details.file? then detailParts.push details.file
		if details.line? then detailParts.push details.line

		if detailParts.length > 0
			prefix = "(#{detailParts.join(':')})#{prefix}"

		if @defaultTypes[options.type]?
			return prefix[@defaultTypes[options.type]]

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
		options.arguments.unshift @getPrefix(options)
		console.log.apply console, options.arguments

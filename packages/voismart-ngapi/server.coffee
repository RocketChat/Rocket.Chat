logger = new Logger 'NGApi'


@NGApi = class NGApi
	constructor: (@server) ->

	login: (username, password, tz) ->
		tz = tz or 'Europe/Rome'
		url = @server
		@_doFormPost url,
			username: username
			password: password
			api: true
			request_date: (new Date).toString()
			browser_tz: tz

	logout: (token) ->
		url = @server + '/jsonrpc/extjs/sessionHandler/'
		data = params: [token], method: 'logout', id: 0
		@_doJsonRpcPost url, data

	getUser: (token) ->
		url = @server + '/jsondata/extjs/userHandler/read_own'
		@_doFormPost url, token: token

	_doPost: (url, data) ->
		try
			response = Meteor.http.post url, data
			if Math.floor(response.statusCode / 100) == 2
				# 2xx status code
				return JSON.parse response.content
			else
				logger.info "request to #{url} returned with status code #{response.statusCode}"
				throw Error 'unhandled response code', response.statusCode
		catch e
			logger.error "error in POST request to #{url}: #{e}"
			logger.debug e.stack
			throw e

	_doJsonRpcPost: (url, data) ->
		@_doPost url, data: data

	_doFormPost: (url, data) ->
		headers = 'Content-Type': 'application/x-www-form-urlencoded'
		@_doPost url,
			params: data
			headers: headers

	getPhones: (token) ->
		url = @server + '/jsondata/extjs/userHandler/read_myextensions'
		@_doFormPost url,
			token: token
			limit: 1

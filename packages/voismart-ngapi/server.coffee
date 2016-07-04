logger = new Logger 'NGApi'


@NGApi = class NGApi
	constructor: (@server) ->

	login: (username, password, tz) ->
		tz = tz or 'Europe/Rome'
		url = @server
		@_doPost url,
			username: username
			password: password
			api: true
			request_date: (new Date).toString()
			browser_tz: tz

	getUser: (token) ->
		url = @server + '/jsondata/extjs/userHandler/read_own'
		@_doPost url, token: token

	_doPost: (url, data, headers) ->
		headers = headers or 'Content-Type': 'application/x-www-form-urlencoded'
		try
			response = Meteor.http.post url, {headers: headers, params: data}
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

	getPhones: (token) ->
		url = @server + '/jsondata/extjs/userHandler/read_myextensions'
		@_doPost url,
			token: token
			limit: 1

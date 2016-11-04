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

	trustedLogin: (username) ->
		domain = username.split('@')[1]
		if not domain
			throw Error 'username must include the domain'
		url = @server + '/trustedauth/login'
		@_doFormPost url,
			username: username
			domain: domain

	trustedLogout: (token) ->
		url = @server + '/trustedauth/logout'
		@_doFormPost url, token: token

	getUser: (token) ->
		url = @server + '/jsondata/extjs/userHandler/read_own'
		@_doFormPost url, token: token

	getPhones: (token) ->
		url = @server + '/jsondata/extjs/userHandler/read_myextensions'
		@_doFormPost url,
			token: token
			limit: 1

	getContacts: (token, filter) ->
		url = @server + '/jsondata/extjs/authedPhonebookHandler/get_contact'
		@_doFormPost url,
			token: token
			filter: filter
			limit: 25
			page: 1
			phonebooktype: 4
			start: 0


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

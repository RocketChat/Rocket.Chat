logger = new Logger 'NGApi'

_cached_token = {}

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

	getPersonalRegistry: (token) ->
		url = @server + '/jsondata/extjs/registryHandler/read_latest'
		@_doFormPost url,
			token: token
			limit: 25
			page: 1
			start: 0
			sort: 'start_time'
			dir: 'DESC'


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

@NGApiAuto = class NGApiAuto extends NGApi
	constructor: (@username, @server) ->
		if !_cached_token[@username]
			@_getToken()

	_getToken: ->
		try
			res = @trustedLogin @username
			_cached_token[@username] = res.token
		catch e
			_cached_token[@username] = undefined

	_doPost: (url, data, attempt) ->
		data.params.token = _cached_token[@username]
		try
			response = Meteor.http.post url, data
			if Math.floor(response.statusCode / 100) == 2
				# 2xx status code
				content = JSON.parse response.content
				if content.errcode == 401 && !attempt?
					attempt = true
					@_getToken()
					return @_doPost url,
						data,
						attempt
				return content
			else
				logger.error "request to #{url} returned with status code #{response.statusCode}"
				throw Error 'unhandled response code', response.statusCode
		catch e
			logger.error "error in POST request to #{url}: #{e}"
			logger.debug e.stack
			throw e

	getContacts: (filter) ->
		super(_cached_token[@username], filter)

	getPersonalRegistry: ->
		super(_cached_token[@username])

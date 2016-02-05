originalPublish = Meteor.publish

RocketChat.connection = new Meteor.EnvironmentVariable()

Meteor.publish = (name, func) ->
	originalPublish name, ->
		self = this
		RocketChat.connection.withValue this._session.connectionHandle, ->
			func.apply self, arguments

Meteor.publish.prototype = originalPublish.prototype


originalMethods = Meteor.methods

Meteor.methods = (methods) ->
	_.each methods, (func, name) ->
		methods[name] = ->
			self = this
			if not self.connection?
				func.apply self, arguments
				return

			RocketChat.connection.withValue self.connection, ->
				func.apply self, arguments

	originalMethods methods


# Tests
Meteor.methods
	'RocketChat.connection': ->
		console.log '[method] RocketChat.connection'.green
		console.log RocketChat.connection.get()
		return

Meteor.publish 'RocketChat.connection', ->
	console.log '[publish] RocketChat.connection'.green
	console.log RocketChat.connection.get()
	return

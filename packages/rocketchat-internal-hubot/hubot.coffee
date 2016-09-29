CoffeeScript = Npm.require('coffee-script')
CoffeeScript.register()

Hubot = Npm.require('hubot')

fs = Npm.require('fs')
path = Npm.require('path')

# Start a hubot, connected to our chat room.
# 'use strict'

# Log messages?
DEBUG = false

# Monkey-patch Hubot to support private messages
Hubot.Response::priv = (strings...) ->
	@robot.adapter.priv @envelope, strings...

# More monkey-patching
Hubot.Robot::loadAdapter = -> # disable

# grrrr, Meteor.bindEnvironment doesn't preserve `this` apparently
bind = (f) ->
	g = Meteor.bindEnvironment (self, args...) -> f.apply(self, args)
	(args...) -> g @, args...

class Robot extends Hubot.Robot
	constructor: (args...) ->
		super args...
		@hear = bind @hear
		@respond = bind @respond
		@enter = bind @enter
		@leave = bind @leave
		@topic = bind @topic
		@error = bind @error
		@catchAll = bind @catchAll
		@user = Meteor.users.findOne {username: @name}, fields: username: 1
	loadAdapter: -> false
	hear:    (regex, callback) -> super regex, Meteor.bindEnvironment callback
	respond: (regex, callback) -> super regex, Meteor.bindEnvironment callback
	enter: (callback) -> super Meteor.bindEnvironment(callback)
	leave: (callback) -> super Meteor.bindEnvironment(callback)
	topic: (callback) -> super Meteor.bindEnvironment(callback)
	error: (callback) -> super Meteor.bindEnvironment(callback)
	catchAll: (callback) -> super Meteor.bindEnvironment(callback)

class RocketChatAdapter extends Hubot.Adapter
	# Public: Raw method for sending data back to the chat source. Extend this.
	#
	# envelope - A Object with message, room and user details.
	# strings  - One or more Strings for each message to send.
	#
	# Returns nothing.
	send: (envelope, strings...) ->
		console.log 'ROCKETCHATADAPTER -> send'.blue if DEBUG
		# console.log envelope, strings
		sendHelper @robot, envelope, strings, (string) =>
			console.log "send #{envelope.room}: #{string} (#{envelope.user.id})" if DEBUG
			RocketChat.sendMessage InternalHubot.user, { msg: string }, { _id: envelope.room }

	# Public: Raw method for sending emote data back to the chat source.
	#
	# envelope - A Object with message, room and user details.
	# strings  - One or more Strings for each message to send.
	#
	# Returns nothing.
	emote: (envelope, strings...) ->
		console.log 'ROCKETCHATADAPTER -> emote'.blue if DEBUG
		sendHelper @robot, envelope, strings, (string) =>
			console.log "emote #{envelope.rid}: #{string} (#{envelope.u.username})" if DEBUG
			return @priv envelope, "*** #{string} ***" if envelope.message.private
			Meteor.call "sendMessage",
				msg: string
				rid: envelope.rid
				action: true

	# Priv: our extension -- send a PM to user
	priv: (envelope, strings...) ->
		console.log 'ROCKETCHATADAPTER -> priv'.blue if DEBUG
		sendHelper @robot, envelope, strings, (string) ->
			console.log "priv #{envelope.room}: #{string} (#{envelope.user.id})" if DEBUG
			Meteor.call "sendMessage",
				u:
					username: "rocketbot"
				to: "#{envelope.user.id}"
				msg: string
				rid: envelope.room

	# Public: Raw method for building a reply and sending it back to the chat
	# source. Extend this.
	#
	# envelope - A Object with message, room and user details.
	# strings  - One or more Strings for each reply to send.
	#
	# Returns nothing.
	reply: (envelope, strings...) ->
		console.log 'ROCKETCHATADAPTER -> reply'.blue if DEBUG
		if envelope.message.private
			@priv envelope, strings...
		else
			@send envelope, strings.map((str) -> "#{envelope.user.name}: #{str}")...

	# Public: Raw method for setting a topic on the chat source. Extend this.
	#
	# envelope - A Object with message, room and user details.
	# strings  - One more more Strings to set as the topic.
	#
	# Returns nothing.
	topic: (envelope, strings...) ->
		console.log 'ROCKETCHATADAPTER -> topic'.blue if DEBUG

	# Public: Raw method for playing a sound in the chat source. Extend this.
	#
	# envelope - A Object with message, room and user details.
	# strings  - One or more strings for each play message to send.
	#
	# Returns nothing
	play: (envelope, strings...) ->
		console.log 'ROCKETCHATADAPTER -> play'.blue if DEBUG

	# Public: Raw method for invoking the bot to run. Extend this.
	#
	# Returns nothing.
	run: ->
		console.log 'ROCKETCHATADAPTER -> run'.blue if DEBUG
		@robot.emit 'connected'
		@robot.brain.mergeData {}
		# @robot.brain.emit 'loaded'

	# Public: Raw method for shutting the bot down. Extend this.
	#
	# Returns nothing.
	close: ->
		console.log 'ROCKETCHATADAPTER -> close'.blue if DEBUG

class InternalHubotReceiver
	constructor: (message) ->
		console.log message if DEBUG
		if message.u.username isnt InternalHubot.name
			room = RocketChat.models.Rooms.findOneById message.rid

			if room.t is 'c'
				InternalHubotUser = new Hubot.User(message.u.username, room: message.rid)
				InternalHubotTextMessage = new Hubot.TextMessage(InternalHubotUser, message.msg, message._id)
				InternalHubot.adapter.receive InternalHubotTextMessage
		return message

class HubotScripts
	constructor: (robot) ->
		modulesToLoad = [
			'hubot-help/src/help.coffee'
		]

		for modulePath in modulesToLoad
			try
				Npm.require(modulePath)(robot)
				robot.parseHelp __meteor_bootstrap__.serverDir+'/npm/rocketchat_internal-hubot/node_modules/'+modulePath
				console.log "Loaded #{modulePath}".green
			catch e
				console.log "can't load #{modulePath}".red
				console.log e

		scriptsToLoad = RocketChat.settings.get('InternalHubot_ScriptsToLoad').split(',') or []

		for scriptFile in scriptsToLoad
			try
				scriptFile = s.trim(scriptFile)

				Npm.require('hubot-scripts/src/scripts/'+scriptFile)(robot)
				# robot.loadFile __meteor_bootstrap__.serverDir+'/npm/node_modules/meteor/rocketchat_internal-hubot/node_modules/hubot-scripts/src/scripts', scriptFile
				robot.parseHelp __meteor_bootstrap__.serverDir+'/npm/node_modules/meteor/rocketchat_internal-hubot/node_modules/hubot-scripts/src/scripts/'+scriptFile
				console.log "Loaded #{scriptFile}".green
			catch e
				console.log "can't load #{scriptFile}".red
				console.log e

sendHelper = Meteor.bindEnvironment (robot, envelope, strings, map) ->
	while strings.length > 0
		string = strings.shift()
		if typeof(string) == 'function'
			string()
		else
			try
				map(string)
			catch err
				console.error "Hubot error: #{err}" if DEBUG
				robot.logger.error "RocketChat send error: #{err}"

InternalHubot = {}

init = =>
	InternalHubot = new Robot null, null, false, RocketChat.settings.get 'InternalHubot_Username'
	InternalHubot.alias = 'bot'
	InternalHubot.adapter = new RocketChatAdapter InternalHubot
	HubotScripts(InternalHubot)
	InternalHubot.run()

	if RocketChat.settings.get 'InternalHubot_Enabled'
		RocketChat.callbacks.add 'afterSaveMessage', InternalHubotReceiver, RocketChat.callbacks.priority.LOW, 'InternalHubot'
	else
		RocketChat.callbacks.remove 'afterSaveMessage', 'InternalHubot'

Meteor.startup ->
	init()
	RocketChat.models.Settings.findByIds([ 'InternalHubot_Username', 'InternalHubot_Enabled', 'InternalHubot_ScriptsToLoad']).observe
		changed: ->
			init()

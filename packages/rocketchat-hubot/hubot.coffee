CoffeeScript = Npm.require('coffee-script')
CoffeeScript.register()

Hubot = Npm.require('hubot')

fs = Npm.require('fs')
path = Npm.require('path')

# Start a hubot, connected to our chat room.
# 'use strict'

# Log messages?
DEBUG = true

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
		console.log 'ROCKETCHATADAPTER -> send'.blue
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
		console.log 'ROCKETCHATADAPTER -> emote'.blue
		sendHelper @robot, envelope, strings, (string) =>
			console.log "emote #{envelope.rid}: #{string} (#{envelope.u.username})" if DEBUG
			return @priv envelope, "*** #{string} ***" if envelope.message.private
			Meteor.call "sendMessage",
				msg: string
				rid: envelope.rid
				action: true

	# Priv: our extension -- send a PM to user
	priv: (envelope, strings...) ->
		console.log 'ROCKETCHATADAPTER -> priv'.blue
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
		console.log 'ROCKETCHATADAPTER -> reply'.blue
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
		console.log 'ROCKETCHATADAPTER -> topic'.blue

	# Public: Raw method for playing a sound in the chat source. Extend this.
	#
	# envelope - A Object with message, room and user details.
	# strings  - One or more strings for each play message to send.
	#
	# Returns nothing
	play: (envelope, strings...) ->
		console.log 'ROCKETCHATADAPTER -> play'.blue

	# Public: Raw method for invoking the bot to run. Extend this.
	#
	# Returns nothing.
	run: ->
		console.log 'ROCKETCHATADAPTER -> run'.blue
		@robot.emit 'connected'
		@robot.brain.mergeData {}
		# @robot.brain.emit 'loaded'

	# Public: Raw method for shutting the bot down. Extend this.
	#
	# Returns nothing.
	close: ->
		console.log 'ROCKETCHATADAPTER -> close'.blue

class InternalHubotReceiver
	constructor: (message) ->
		#console.log message
		if message.u.username isnt InternalHubot.name
			room = RocketChat.models.Rooms.findOneById message.rid

			if room.t is 'c'
				console.log message
				InternalHubotUser = new Hubot.User(message.u.username, room: message.rid)
				InternalHubotTextMessage = new Hubot.TextMessage(InternalHubotUser, message.msg, message._id)
				InternalHubot.adapter.receive InternalHubotTextMessage
		return message

class HubotScripts
	constructor: (robot) ->
		modulesToLoad = [
			'hubot-youtube/src/youtube.coffee'
			'hubot-maps/src/maps.coffee'
			'hubot-google-translate/src/google-translate.coffee'
			'hubot-google-images/src/google-images.coffee'
			'hubot-calculator/src/calculator.coffee'
			'hubot-help/src/help.coffee'
		]

		for modulePath in modulesToLoad
			try
				Npm.require(modulePath)(robot)
				robot.parseHelp __meteor_bootstrap__.serverDir+'/npm/rocketchat_hubot/node_modules/'+modulePath
				console.log "Loaded #{modulePath}".green
			catch e
				console.log "can't load #{modulePath}".red
				console.log e

		# scriptFiles = fs.readdirSync(__meteor_bootstrap__.serverDir+'/npm/rocketchat_hubot/node_modules/hubot-scripts/src/scripts')

		scriptsToLoad = [
			'alot.coffee'
			'applause.coffee'
			'beerme.coffee'
			'botsnack.coffee'
			'carlton.coffee'
			'chuck-norris.coffee'
			'commandlinefu.coffee'
			'commitmessage.coffee'
			'dealwithit.coffee'
			'decide.coffee'
			'dice.coffee'
			'do-it.coffee'
			'dribbble.coffee'
			'encourage.coffee'
			'excuse.coffee'
			'factoid.coffee'
			'futurama.coffee'
			'go-for-it.coffee'
			'gob.coffee'
			'google.coffee'
			'gorbypuff.coffee'
			'hangout.coffee'
			'hashing.coffee'
			'hello.coffee'
			'httpcat.coffee'
			'karma.coffee'
			'megusta.coffee'
			'nice.coffee'
			'play.coffee'
			'plus_one.coffee'
			'polite.coffee'
			'reddit-jokes.coffee'
			'reload.coffee'
			'sealab.coffee'
			'sheits.coffee'
			'shipit.coffee'
			'url.coffee'
			'wits.coffee'
			'wordnik.coffee'
			'yoda-pictures.coffee'
			'yoda-quotes.coffee'
			'zen.coffee'
			'zombies.coffee'
		]

		for scriptFile in scriptsToLoad
			try
				Npm.require('hubot-scripts/src/scripts/'+scriptFile)(robot)
				# robot.loadFile __meteor_bootstrap__.serverDir+'/npm/rocketchat_hubot/node_modules/hubot-scripts/src/scripts', scriptFile
				robot.parseHelp __meteor_bootstrap__.serverDir+'/npm/rocketchat_hubot/node_modules/hubot-scripts/src/scripts/'+scriptFile
				console.log "Loaded #{scriptFile}".green
			catch e
				console.log "can't load #{scriptFile}".red
				console.log e

		# console.log __meteor_bootstrap__.serverDir

		# npm/rocketchat_hubot/node_modules
		# packages/rocketchat_hubot.js

		# # load all scripts in scripts/
		# console.log path.resolve '.'
		# scriptPath = path.resolve __dirname, 'scripts'
		# console.log scriptPath
		# for file in fs.readdirSync(scriptPath)
		# 	continue unless /\.(coffee|js)$/.test(file)
		# 	robot.loadFile scriptPath, file

		# return
		# # load all scripts from hubot-scripts
		# scriptPath = path.resolve __dirname, 'node_modules', 'hubot-scripts', 'src', 'scripts'
		# scripts = require './hubot-scripts.json'
		# robot.loadHubotScripts scriptPath, scripts
		# robot.parseHelp path.join scriptPath, 'meme_captain.coffee'

		# # load all hubot-* modules from package.json
		# packageJson = require './package.json'
		# pkgs = (pkg for own pkg, version of packageJson.dependencies when !/^(coffee-script|hubot-scripts|hubot-help)$/.test(pkg))
		# pkgs.forEach (p) -> (require p)(robot)

		# # A special hack for hubot-help: ensure it replies via pm
		# privRobot = Object.create robot
		# privRobot.respond = (regex, cb) ->
		# 	robot.respond regex, (resp) ->
		# 		resp.message.private = true
		# 		cb(resp)
		# (require 'hubot-help')(privRobot)

		# # A special hack for meme_captain: change its "respond" invocations to "hear" so that it memes everywhere.
		# memecaptain = require './node_modules/hubot-scripts/src/scripts/meme_captain'
		# memecaptain
		# 	respond: (regex, cb) ->
		# 		robot.hear regex, (msg) ->
		# 			cb(msg) if msg.envelope.room is 'general/0' or /^\s*[@]?(rocket)?bot\b/i.test(msg.message.text)

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

	# InternalHubot.hear /^test/i, (res) ->
	#	res.send "Test? TESTING? WE DON'T NEED NO TEST, EVERYTHING WORKS!"

	if RocketChat.settings.get 'InternalHubot_Enabled'
		RocketChat.callbacks.add 'afterSaveMessage', InternalHubotReceiver, RocketChat.callbacks.priority.LOW, 'rocketbot-parser'
	else
		RocketChat.callbacks.remove 'afterSaveMessage', 'rocketbot-parser'

	# Meteor.startup ->
		# console.log InternalHubot;
		# # what's (the regexp for) my name?
		# robot.respond /(?:)/, -> false
		# mynameRE = robot.listeners.pop().regex
		# # register scripts
		# HubotScripts(robot)
		# Object.keys(share.hubot).forEach (scriptName) ->
		# 	console.log "Loading hubot script: #{scriptName}"
		# 	share.hubot[scriptName](robot)
		# # register our nick
		# n = Meteor.call 'newNick', {name: 'rocketbot'}
		# Meteor.call 'setTag', {type:'nicks', object:n._id, name:'Gravatar', value:'rocket@printf.net', who:n.canon}
		# # register our presence in general chat
		# keepalive = -> Meteor.call 'setPresence',
		# 	u:
		# 		username: 'rocketbot'
		# 	rid: 'GENERAL'
		# 	present: true
		# 	foreground: true
		# keepalive()
		# Meteor.setInterval keepalive, 30*1000 # every 30s refresh presence
		# # listen to the chat room, ignoring messages sent before we startup
		# startup = true
		# ChatMessage.find({}).observe
		# 	added: (message) ->
		# 		return if startup
		# 		return if message.u.username is "rocketbot" or message.u.username is ""
		# 		return if message.system or message.action or message.oplog or message.bodyIsHtml
		# 		console.log "Received from #{message.u.username} in #{message.rid}: #{message.body}"\
		# 			if DEBUG
		# 		user = new Hubot.User(message.u.username, room: message.rid)
		# 		tm = new Hubot.TextMessage(user, message.body, message._id)
		# 		tm.private = message.to?
		# 		# if private, ensure it's treated as a direct address
		# 		if tm.private and not mynameRE.test(tm.text)
		# 			tm.text = "#{robot.name} #{tm.text}"
		# 		adapter.receive tm
		# startup = false
		# Meteor.call "sendMessage",
		# 	rid: 'GENERAL'
		# 	msg: 'wakes up'
		# 	u:
		# 		username: "rocketbot"
		# 	action: true

RocketChat.models.Settings.findByIds([ 'InternalHubot_Username', 'InternalHubot_Enabled']).observe
	added: ->
		init()
	changed: ->
		init()
	removed: ->
		init()

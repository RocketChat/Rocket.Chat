
class botCommands
	constructor: ->
		@commands = {}

	addCommand: (command) ->
		console.log "ADDING COMMAND #{command.command}"
		name = command.command.replace(/\W+/g, '')
		@commands[name] = command
		
	listCommands: () ->
		return @commands


RocketChat.botCommands = new botCommands()


class botAutoComplete
	constructor: ->
		@commands = {}

	addCommand: (command) ->
		console.log "ADDING COMMAND #{command.command}"
		name = command.command.replace(/\W+/g, '')
		@commands[name] = command


RocketChat.botAutoComplete = new botAutoComplete()

###
# Invite is a named function that will replace /invite commands
# @param {Object} message - The message object
###
if Meteor.isClient
	Test = undefined
else
	class Test
		constructor: () ->
			console.log 'Importer Test initialized'
		prepare: ->
			console.log 'test'
		doImport: (data) ->
			console.log data

RocketChat.importTool.add 'test', Test,
	name: '[Platform X] Import'
	fileType: 'application/zip'
	description: 'Imports [Platform X] data into Rocket.Chat'

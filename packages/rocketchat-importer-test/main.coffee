if Meteor.isClient
	Test = undefined
else
	aTest = new RocketChat.importTool.TestImporter

	class Test
		constructor: () ->
			console.log 'Importer Test initialized'
		prepare: ->
			console.log 'test'
		doImport: (data) ->
			console.log data

RocketChat.importTool.add 'test', Test,
	name: '[Platform X] Import'
	fileTypeRegex: new RegExp 'application\/.*?zip'
	description: 'Imports [Platform X] data into Rocket.Chat'

Template.avatarPrompt.onCreated ->
	self = this
	self.suggestions = new ReactiveVar

	Meteor.call 'getAvatarSuggestion', (error, avatars) ->
		self.suggestions.set
			ready: true
			avatars: avatars


Template.avatarPrompt.helpers
	suggestions: ->
		return Template.instance().suggestions.get()


Template.avatarPrompt.events
	'click .select-service': (e) ->
		Meteor.call 'setAvatarFromService', this.blob, this.service, ->
			console.log arguments

	'change .myFileInput': (event, template) ->
		FS.Utility.eachFile event, (blob) ->
			reader = new FileReader()
			reader.readAsDataURL(blob)
			reader.onloadend = ->
				Meteor.call 'setAvatarFromService', reader.result, 'upload', ->
					console.log arguments
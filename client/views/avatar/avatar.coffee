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
		username = Meteor.user().username
		file = new FS.File(this.blob)
		file.attachData this.blob, (error) ->
			if error?
				console.log error
			else
				file.name(username)
				Images.insert file, (err, fileObj) ->
					console.log arguments

	'change .myFileInput': (event, template) ->
		username = Meteor.user().username
		FS.Utility.eachFile event, (blob) ->
			file = new FS.File(blob)
			file.attachData blob, (error) ->
				if error?
					console.log error
				else
					file.name(username)
					Images.insert file, (err, fileObj) ->
						console.log arguments
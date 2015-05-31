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

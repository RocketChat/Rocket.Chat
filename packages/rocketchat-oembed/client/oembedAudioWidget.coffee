Template.oembedAudioWidget.helpers

	collapsed: ->
		if this.collapsed?
			return this.collapsed
		else
			return Meteor.user()?.settings?.preferences?.collapseMediaByDefault is true

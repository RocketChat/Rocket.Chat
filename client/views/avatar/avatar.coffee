Template.avatar.helpers
	dimensions: ->
		return {
			width: 40
			height: 40
		}

	imageUrl: ->
		username = this.username
		if not username? and this.userId?
			username = Meteor.users.findOne(this.userId)?.username
		url = "#{Meteor.absoluteUrl()}avatar/#{username}"
		return url
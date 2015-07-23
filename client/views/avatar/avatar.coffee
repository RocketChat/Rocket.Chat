Template.avatar.helpers
	imageUrl: ->
		if this.preventImage?
			return

		username = this.username
		if not username? and this.userId?
			username = Meteor.users.findOne(this.userId)?.username

		if not username?
			return

		url = getAvatarUrlFromUsername(username)

		return "background-image:url(#{url});"

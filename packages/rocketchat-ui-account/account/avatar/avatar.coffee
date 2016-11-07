Template.avatar.helpers
	imageUrl: ->
		username = this.username
		if not username? and this.userId?
			username = Meteor.users.findOne(this.userId)?.username

		if not username?
			return

		user = Meteor.users.findOne({username:this.u?.username})
		if user?.photo
			return user?.photo

		Session.get "avatar_random_#{username}"

		url = getAvatarUrlFromUsername(username)

		return "background-image:url(#{url});"

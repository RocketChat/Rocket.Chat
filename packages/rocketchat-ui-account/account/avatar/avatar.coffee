Template.avatar.helpers
	imageUrl: ->
		username = this.username
		if not username? and this.userId?
			username = Meteor.users.findOne(this.userId)?.username

		if not username?
			return

		user = Meteor.users.findOne({name:username})
		if (!user)
			user = Meteor.users.findOne({username:username})

		if user?.photo_full
			return "background-image:url(#{user.photo_full});"

		Session.get "avatar_random_#{username}"

		url = getAvatarUrlFromUsername(username)

		return "background-image:url(#{url});"

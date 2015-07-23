Template.avatar.helpers
	imageUrl: ->
		if this.preventImage?
			return

		username = this.username
		random = Session.get('AvatarRandom')
		if not username? and this.userId?
			username = Meteor.users.findOne(this.userId)?.username

		if not username?
			return

		return "background-image:url(#{Meteor.absoluteUrl()}avatar/#{username}.jpg?_dc=#{random});"
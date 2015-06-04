colors = ['#F44336','#E91E63','#9C27B0','#673AB7','#3F51B5','#2196F3','#03A9F4','#00BCD4','#009688','#4CAF50','#8BC34A','#CDDC39','#FFC107','#FF9800','#FF5722','#795548','#9E9E9E','#607D8B']
Template.avatar.helpers
	initials: ->
		username = this.username or ''
		username = username.replace(/[^A-Za-z0-9]/g, '.').replace(/\.+/g, '.').replace(/(^\.)|(\.$)/g, '')
		usernameParts = username.split('.')
		if usernameParts.length > 1
			return _.first(usernameParts)[0] + _.last(usernameParts)[0]

		return username.replace(/[^A-Za-z0-9]/g, '').substr(0, 2)

	color: ->
		username = this.username or ''
		position = username.length % colors.length
		return colors[position]

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
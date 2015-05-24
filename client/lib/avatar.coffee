Avatar.options =
	defaultImageUrl: "/images/no_picture.png"

Avatar.getInitials = (user) ->
	initials = ''
	if user?.name?
		parts = user.name.split(' ');
		initials = _.first(parts).charAt(0).toUpperCase()
		if parts.length > 1
			initials += _.last(parts).charAt(0).toUpperCase()

	return initials
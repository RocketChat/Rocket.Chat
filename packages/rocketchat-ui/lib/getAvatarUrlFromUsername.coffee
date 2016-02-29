@getAvatarUrlFromUsername = (username) ->
	key = "avatar_random_#{username}"
	random = Session?.keys[key] or 0
	if not username?
		return

	if Meteor.isCordova
		path = Meteor.absoluteUrl()
	else
		path = '/'
	"#{path}avatar/#{encodeURIComponent(username)}.jpg?_dc=#{random}"

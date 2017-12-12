@getAvatarUrlFromUsername = (username) ->
	key = "avatar_random_#{username}"
	random = Session?.keys[key] or 0
	if not username?
		return
	if Meteor.isCordova
		path = Meteor.absoluteUrl().replace /\/$/, ''
	else
		path = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX || '';
	user = Meteor.users.findOne({name:username})
	if (!user)
		user = Meteor.users.findOne({username:username})
	if user?.photo
		return "#{user.photo}"
	"#{path}/avatar/#{encodeURIComponent(username)}.jpg?_dc=#{random}"

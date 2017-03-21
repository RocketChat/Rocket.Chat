@getAvatarUrlFromUsername = (username) ->
	key = "avatar_random_#{username}"
	random = Session?.keys[key] or 0

	if not username?
		return

	cdnPrefix = (RocketChat.settings.get('CDN_PREFIX') or '').trim().replace(/\/$/, '')
	pathPrefix = (__meteor_runtime_config__.ROOT_URL_PATH_PREFIX or '').trim().replace(/\/$/, '')

	if cdnPrefix
		path = cdnPrefix + pathPrefix
	else if Meteor.isCordova
		# Meteor.absoluteUrl alread has path prefix
		path = Meteor.absoluteUrl().replace(/\/$/, '')
	else
		path = pathPrefix

	return "#{path}/avatar/#{encodeURIComponent(username)}?_dc=#{random}"

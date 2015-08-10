###
# Add a setting 
# @param {String} _id
# @param {Mixed} value
# @param {Object} setting
###

RocketChat.settings.add = (_id, value, options = {}) ->
	if not _id or not value?
		return false

	# console.log '[functions] RocketChat.settings.add -> '.green, 'arguments:', arguments

	if Meteor.settings?[_id]?
		value = Meteor.settings[_id]

	updateSettings =
		i18nLabel: options.i18nLabel or _id
		i18nDescription: options.i18nDescription if options.i18nDescription?

	updateSettings.type = options.type if options.type
	updateSettings.multiline = options.multiline if options.multiline
	updateSettings.group = options.group if options.group
	updateSettings.public = options.public if options.public

	return Settings.upsert { _id: _id }, { $setOnInsert: { value: value }, $set: updateSettings }

###
# Add a setting group
# @param {String} _id
###

RocketChat.settings.addGroup = (_id, options = {}) ->
	if not _id
		return false

	# console.log '[functions] RocketChat.settings.addGroup -> '.green, 'arguments:', arguments

	updateSettings = 
		i18nLabel: options.i18nLabel or _id
		i18nDescription: options.i18nDescription if options.i18nDescription?
		type: 'group'
	
	return Settings.upsert { _id: _id }, { $set: updateSettings }

Meteor.methods
	saveSetting: (_id, value) ->
		if Meteor.userId()?
			user = Meteor.users.findOne Meteor.userId()
		
		unless user?.admin is true
			throw new Meteor.Error 503, 'Not authorized'

		# console.log "saveSetting -> ".green, _id, value
		Settings.update { _id: _id }, { $set: { value: value } }
		return true
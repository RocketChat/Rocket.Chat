###
# Add a setting 
# @param {String} _id
# @param {Mixed} value
# @param {Object} setting
###

RocketChat.settings.add = (_id, value, options = {}) ->
	if not _id or not value?
		return false

	console.log '[functions] RocketChat.settings.add -> '.green, 'arguments:', arguments

	if Meteor.settings?[_id]?
		value = Meteor.settings[_id]
	if Meteor.settings?.public?[_id]?
		value = Meteor.settings.public[_id]

	updateSettings =
		i18nLabel: options.i18nLabel or _id
		
	updateSettings.type = options.type if options.type
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

	console.log '[functions] RocketChat.settings.addGroup -> '.green, 'arguments:', arguments

	updateSettings = 
		i18nLabel: options.i18nLabel or _id
		type: 'group'
	
	return Settings.upsert { _id: _id }, { $set: updateSettings }

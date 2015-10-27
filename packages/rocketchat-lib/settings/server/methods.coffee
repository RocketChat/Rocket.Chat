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

	if process?.env?[_id]?
		value = process.env[_id]
	else if Meteor.settings?[_id]?
		value = Meteor.settings[_id]

	updateSettings =
		i18nLabel: options.i18nLabel or _id

	updateSettings.i18nDescription = options.i18nDescription if options.i18nDescription?
	updateSettings.type = options.type if options.type
	updateSettings.multiline = options.multiline if options.multiline
	updateSettings.group = options.group if options.group
	updateSettings.section = options.section if options.section
	updateSettings.public = options.public if options.public

	upsertChanges = { $setOnInsert: { value: value }, $set: updateSettings }

	if options.persistent is true
		upsertChanges.$unset = { ts: true }
	else
		upsertChanges.$set.ts = new Date

	return RocketChat.models.Settings.upsert { _id: _id }, upsertChanges


###
# Add a setting group
# @param {String} _id
###
RocketChat.settings.addGroup = (_id, options = {}) ->
	if not _id
		return false

	# console.log '[functions] RocketChat.settings.addGroup -> '.green, 'arguments:', arguments

	updateSettings =
		type: 'group'
		i18nLabel: options.i18nLabel or _id

	updateSettings.i18nDescription = options.i18nDescription if options.i18nDescription?

	upsertChanges = { $set: updateSettings }
	if options.persistent is true
		upsertChanges.$unset = { ts: true }
	else
		upsertChanges.$set.ts = new Date

	return RocketChat.models.Settings.upsert { _id: _id }, upsertChanges


###
# Remove a setting by id
# @param {String} _id
###
RocketChat.settings.removeById = (_id) ->
	if not _id
		return false

	# console.log '[functions] RocketChat.settings.add -> '.green, 'arguments:', arguments

	return RocketChat.models.Settings.removeById _id


###
# Update a setting by id
# @param {String} _id
###
RocketChat.settings.updateById = (_id, value) ->
	RocketChat.models.Settings.updateValueById _id, value


Meteor.methods
	saveSetting: (_id, value) ->
		console.log '[method] saveSetting', _id, value
		if Meteor.userId()?
			user = Meteor.users.findOne Meteor.userId()

		unless RocketChat.authz.hasPermission(Meteor.userId(), 'edit-privileged-setting') is true
			throw new Meteor.Error 503, 'Not authorized'

		# console.log "saveSetting -> ".green, _id, value
		RocketChat.settings.updateById _id, value
		return true

###
# Add a setting
# @param {String} _id
# @param {Mixed} value
# @param {Object} setting
###
RocketChat.settings.add = (_id, value, options = {}) ->
	# console.log '[functions] RocketChat.settings.add -> '.green, 'arguments:', arguments

	if not _id or not value?
		return false

	options.packageValue = value
	options.valueSource = 'packageValue'

	if process?.env?[_id]?
		value = process.env[_id]
		options.processEnvValue = value
		options.valueSource = 'processEnvValue'

	else if Meteor.settings?[_id]?
		value = Meteor.settings[_id]
		options.meteorSettingsValue = value
		options.valueSource = 'meteorSettingsValue'

	if not options.i18nLabel?
		options.i18nLabel = _id

	# Default description i18n key will be the setting name + "_Description" (eg: LDAP_Enable -> LDAP_Enable_Description)
	if not options.i18nDescription?
		options.i18nDescription = "#{_id}_Description"

	upsertChanges =
		$set: options
		$setOnInsert:
			value: value
			createdAt: new Date

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
	# console.log '[functions] RocketChat.settings.addGroup -> '.green, 'arguments:', arguments

	if not _id
		return false

	if not options.i18nLabel?
		options.i18nLabel = _id

	if not options.i18nDescription?
		options.i18nDescription = "#{_id}_Description"

	upsertChanges =
		$set: options
		$setOnInsert:
			type: 'group'
			createdAt: new Date

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
	# console.log '[functions] RocketChat.settings.add -> '.green, 'arguments:', arguments

	if not _id
		return false

	return RocketChat.models.Settings.removeById _id


###
# Update a setting by id
# @param {String} _id
###
RocketChat.settings.updateById = (_id, value) ->
	# console.log '[functions] RocketChat.settings.updateById -> '.green, 'arguments:', arguments

	if not _id or not value?
		return false

	return RocketChat.models.Settings.updateValueById _id, value


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

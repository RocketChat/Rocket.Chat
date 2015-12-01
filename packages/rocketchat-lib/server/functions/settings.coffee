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
	options.ts = new Date
	options.hidden = false

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

	return RocketChat.models.Settings.upsert { _id: _id },
		$set: options
		$setOnInsert:
			value: value
			createdAt: new Date


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

	options.ts = new Date
	options.hidden = false

	return RocketChat.models.Settings.upsert { _id: _id },
		$set: options
		$setOnInsert:
			type: 'group'
			createdAt: new Date


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


###
# Update a setting by id
###
RocketChat.settings.init = ->
	initialLoad = true
	RocketChat.models.Settings.find().observe
		added: (record) ->
			Meteor.settings[record._id] = record.value
			process.env[record._id] = record.value
			RocketChat.settings.load record._id, record.value, initialLoad
		changed: (record) ->
			Meteor.settings[record._id] = record.value
			process.env[record._id] = record.value
			RocketChat.settings.load record._id, record.value, initialLoad
		removed: (record) ->
			delete Meteor.settings[record._id]
			delete process.env[record._id]
			RocketChat.settings.load record._id, undefined, initialLoad
	initialLoad = false

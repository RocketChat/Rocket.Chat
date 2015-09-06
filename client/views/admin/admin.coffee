Template.admin.helpers
	isAdmin: ->
		return Meteor.user().admin is true
	group: ->
		group = FlowRouter.getParam('group')
		group ?= Settings.findOne({ type: 'group' })?._id
		return Settings.findOne { _id: group, type: 'group' }
	sections: ->
		group = FlowRouter.getParam('group')
		group ?= Settings.findOne({ type: 'group' })?._id
		settings = Settings.find({ group: group }, {sort: {section: 1}}).fetch()
		sections = {}
		for setting in settings
			sections[setting.section or ''] ?= []
			sections[setting.section or ''].push setting

		sectionsArray = []
		for key, value of sections
			sectionsArray.push
				section: key
				settings: value

		return sectionsArray

	flexOpened: ->
		return 'opened' if Session.equals('flexOpened', true)
	arrowPosition: ->
		console.log 'room.helpers arrowPosition' if window.rocketDebug
		return 'left' unless Session.equals('flexOpened', true)
	label: ->
		label = @i18nLabel or @_id
		if label?.indexOf(':') is -1
			label = 'project:' + label
		return TAPi18next.t label
	description: ->
		description = @i18nDescription
		if description?.indexOf(':') is -1
			description = 'project:' + description
		return TAPi18next.t description

Template.admin.events
	"click .submit": (e, t) ->
		group = FlowRouter.getParam('group')
		settings = Settings.find({ group: group }).fetch()
		console.log 'will save settings', JSON.stringify settings
		updateSettings = []
		for setting in settings
			value = null
			if setting.type is 'string'
				value = _.trim(t.$("[name=#{setting._id}]").val())
			else if setting.type is 'int'
				value = parseInt(_.trim(t.$("[name=#{setting._id}]").val()))
			else if setting.type is 'boolean' and t.$("[name=#{setting._id}]:checked").length
				value = if t.$("[name=#{setting._id}]:checked").val() is "1" then true else false

			if value?
				updateSettings.push { _id: setting._id, value: value }

		console.log 'changed settings', JSON.stringify updateSettings

		if not _.isEmpty updateSettings
			RocketChat.settings.batchSet updateSettings, (err, success) ->
				return toastr.error TAPi18next.t 'project:Error_updating_settings' if err
				toastr.success TAPi18next.t 'project:Settings_updated'

Template.admin.onRendered ->
	Tracker.afterFlush ->
		SideNav.setFlex "adminFlex"
		SideNav.openFlex()
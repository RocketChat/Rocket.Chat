Template.settings.helpers
	isAdmin: ->
		return Meteor.user().admin is true
	groups: ->
		return Settings.find({type: 'group'}).fetch()
	group: ->
		group = FlowRouter.getParam('group')
		group ?= Settings.findOne({ type: 'group' })?._id
		return Settings.findOne { _id: group, type: 'group' }
	settings: ->
		group = FlowRouter.getParam('group')
		group ?= Settings.findOne({ type: 'group' })?._id
		return Settings.find({ group: group }).fetch()
	flexOpened: ->
		return 'opened' if Session.equals('flexOpened', true)
	arrowPosition: ->
		console.log 'room.helpers arrowPosition' if window.rocketDebug
		return 'left' unless Session.equals('flexOpened', true)
	label: ->
		return TAPi18next.t @i18nLabel
	description: ->
		return TAPi18next.t @i18nDescription

Template.settings.events

	"click .submit": ->
		group = FlowRouter.getParam('group')
		settings = Settings.find({ group: group }).fetch()
		updateSettings = []
		for setting in settings
			value = null
			if setting.type is 'string'
				value = _.trim($("input[name=#{setting._id}]").val())
			else if setting.type is 'boolean' and $("input[name=#{setting._id}]:checked").length
				value = if $("input[name=#{setting._id}]:checked").val() is "1" then true else false

			if value?
				updateSettings.push { _id: setting._id, value: value }

		if not _.isEmpty updateSettings
			RocketChat.settings.batchSet updateSettings, (err, success) ->
				return toastr.error TAPi18next.t 'Error_updating_settings' if err
				toastr.success TAPi18next.t 'Settings_updated'

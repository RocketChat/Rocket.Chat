Template.admin.helpers
	group: ->
		group = FlowRouter.getParam('group')
		group ?= Settings.findOne({ type: 'group' })?._id
		return Settings.findOne { _id: group, type: 'group' }
	sections: ->
		group = FlowRouter.getParam('group')
		group ?= Settings.findOne({ type: 'group' })?._id
		settings = Settings.find({ group: group }, {sort: {section: 1, i18nLabel: 1}}).fetch()
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
		return 'opened' if RocketChat.TabBar.isFlexOpen()
	arrowPosition: ->
		console.log 'room.helpers arrowPosition' if window.rocketDebug
		return 'left' unless RocketChat.TabBar.isFlexOpen()
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
	sectionIsCustomOath: (section) ->
		return /^Custom OAuth:\s.+/.test section
	callbackURL: (section) ->
		id = s.strRight(section, 'Custom OAuth: ').toLowerCase()
		return Meteor.absoluteUrl('_oauth/' + id)

Template.admin.events
	"click .submit .save": (e, t) ->
		group = FlowRouter.getParam('group')
		settings = Settings.find({ group: group }).fetch()
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

		if not _.isEmpty updateSettings
			RocketChat.settings.batchSet updateSettings, (err, success) ->
				return toastr.error TAPi18next.t 'project:Error_updating_settings' if err
				toastr.success TAPi18next.t 'project:Settings_updated'

	"click .submit .add-custom-oauth": (e, t) ->
		config =
			title: TAPi18next.t 'project:Add_custom_oauth'
			text: TAPi18next.t 'project:Give_a_unique_name_for_the_custom_oauth'
			type: "input",
			showCancelButton: true,
			closeOnConfirm: true,
			inputPlaceholder: TAPi18next.t 'project:Custom_oauth_unique_name'

		swal config, (inputValue) ->
			if inputValue is false
				return false

			if inputValue is ""
				swal.showInputError TAPi18next.t 'project:Name_cant_be_empty'
				return false

			Meteor.call 'addOAuthService', inputValue

	"click .submit .remove-custom-oauth": (e, t) ->
		name = this.section.replace('Custom OAuth: ', '')
		config =
			title: TAPi18next.t 'project:Are_you_sure'
			type: "input",
			type: 'warning'
			showCancelButton: true
			confirmButtonColor: '#DD6B55'
			confirmButtonText: TAPi18next.t 'project:Yes_delete_it'
			cancelButtonText: TAPi18next.t 'project:Cancel'
			closeOnConfirm: true

		swal config, ->
			Meteor.call 'removeOAuthService', name


Template.admin.onRendered ->
	Tracker.afterFlush ->
		SideNav.setFlex "adminFlex"
		SideNav.openFlex()

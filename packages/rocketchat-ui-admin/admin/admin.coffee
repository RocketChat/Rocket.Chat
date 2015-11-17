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
		return TAPi18n.__ label if label
	description: ->
		description = @i18nDescription
		return TAPi18n.__ description if description
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
			else if setting.type is 'color'
				value = _.trim(t.$("[name=#{setting._id}]").val())

			if value?
				updateSettings.push { _id: setting._id, value: value }

		if not _.isEmpty updateSettings
			RocketChat.settings.batchSet updateSettings, (err, success) ->
				return toastr.error TAPi18n.__ 'Error_updating_settings' if err
				toastr.success TAPi18n.__ 'Settings_updated'

	"click .submit .reset-default-theme": (e, t) ->
		group = FlowRouter.getParam('group')
		settings = Settings.find({ group: group }).fetch()
		updateSettings = []
		updateSettings.push { _id: "theme-color-content-background-color", value: "#FFF" }
		updateSettings.push { _id: "theme-color-primary-background-color", value: "#04436A" }
		updateSettings.push { _id: "theme-color-secondary-background-color", value: "#F4F4F4" }
		updateSettings.push { _id: "theme-color-tertiary-background-color", value: "#EAEAEA" }
		updateSettings.push { _id: "theme-color-primary-font-color", value: "#444444" }
		updateSettings.push { _id: "theme-color-secondary-font-color", value: "#7F7F7F" }
		updateSettings.push { _id: "theme-color-tertiary-font-color", value: "rgba(255, 255, 255, 0.6)" }
		updateSettings.push { _id: "theme-color-input-font-color", value: "rgba(255, 255, 255, 0.85)" }
		updateSettings.push { _id: "theme-color-link-font-color", value: "#008CE3" }
		updateSettings.push { _id: "theme-color-info-font-color", value: "#AAAAAA" }
		updateSettings.push { _id: "theme-color-info-active-font-color", value: "#FF0000" }
		updateSettings.push { _id: "theme-color-smallprint-font-color", value: "#C2E7FF" }
		updateSettings.push { _id: "theme-color-smallprint-hover-color", value: "#FFFFFF" }
		updateSettings.push { _id: "theme-color-status-online", value: "#35AC19" }
		updateSettings.push { _id: "theme-color-status-offline", value: "rgba(150, 150, 150, 0.50)" }
		updateSettings.push { _id: "theme-color-status-busy", value: "#D30230" }
		updateSettings.push { _id: "theme-color-status-away", value: "#FCB316" }
		updateSettings.push { _id: "theme-color-code-background", value: "#F8F8F8" }
		updateSettings.push { _id: "theme-color-code-border", value: "#CCC" }
		updateSettings.push { _id: "theme-color-code-color", value: "#333" }
		updateSettings.push { _id: "theme-color-blockquote-background", value: "#CCC" }

		if not _.isEmpty updateSettings
			RocketChat.settings.batchSet updateSettings, (err, success) ->
				return toastr.error TAPi18n.__ 'Error Resetting Settings' if err
				toastr.success TAPi18n.__ 'Reset to Default'

	"click .submit .add-custom-oauth": (e, t) ->
		config =
			title: TAPi18n.__ 'Add_custom_oauth'
			text: TAPi18n.__ 'Give_a_unique_name_for_the_custom_oauth'
			type: "input",
			showCancelButton: true,
			closeOnConfirm: true,
			inputPlaceholder: TAPi18n.__ 'Custom_oauth_unique_name'

		swal config, (inputValue) ->
			if inputValue is false
				return false

			if inputValue is ""
				swal.showInputError TAPi18n.__ 'Name_cant_be_empty'
				return false

			Meteor.call 'addOAuthService', inputValue

	"click .submit .remove-custom-oauth": (e, t) ->
		name = this.section.replace('Custom OAuth: ', '')
		config =
			title: TAPi18n.__ 'Are_you_sure'
			type: "input",
			type: 'warning'
			showCancelButton: true
			confirmButtonColor: '#DD6B55'
			confirmButtonText: TAPi18n.__ 'Yes_delete_it'
			cancelButtonText: TAPi18n.__ 'Cancel'
			closeOnConfirm: true

		swal config, ->
			Meteor.call 'removeOAuthService', name


Template.admin.onRendered ->
	Tracker.afterFlush ->
		SideNav.setFlex "adminFlex"
		SideNav.openFlex()

	Meteor.setTimeout ->
		$('input.minicolors').minicolors({theme: 'rocketchat'})
	, 500

	Tracker.autorun ->
		FlowRouter.watchPathChange()
		Meteor.setTimeout ->
			$('input.minicolors').minicolors({theme: 'rocketchat'})
		, 200

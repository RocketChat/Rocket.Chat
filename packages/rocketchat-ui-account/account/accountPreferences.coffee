Template.accountPreferences.helpers
	languages: ->
		languages = TAPi18n.getLanguages()
		result = []
		for key, language of languages
			result.push _.extend(language, { key: key })
		return _.sortBy(result, 'key')

	userLanguage: (key) ->
		return (Meteor.user().language or defaultUserLanguage())?.split('-').shift().toLowerCase() is key

	checked: (property, value, defaultValue) ->
		if not Meteor.user()?.settings?.preferences?[property]? and defaultValue is true
			currentValue = value
		else if Meteor.user()?.settings?.preferences?[property]?
			currentValue = !!Meteor.user()?.settings?.preferences?[property]

		return currentValue is value

	selected: (property, value, defaultValue) ->
		if not Meteor.user()?.settings?.preferences?[property]
			return defaultValue
		else
			return Meteor.user()?.settings?.preferences?[property] == value

	highlights: ->
		return Meteor.user()?.settings?.preferences?['highlights']?.join(', ')

	desktopNotificationEnabled: ->
		return (KonchatNotification.notificationStatus.get() is 'granted') or (window.Notification && Notification.permission is "granted")

	desktopNotificationDisabled: ->
		return (KonchatNotification.notificationStatus.get() is 'denied') or (window.Notification && Notification.permission is "denied")

Template.accountPreferences.onCreated ->
	settingsTemplate = this.parentTemplate(3)
	settingsTemplate.child ?= []
	settingsTemplate.child.push this

	@useEmojis = new ReactiveVar not Meteor.user()?.settings?.preferences?.useEmojis? or Meteor.user().settings.preferences.useEmojis
	instance = @
	@autorun ->
		if instance.useEmojis.get()
			Tracker.afterFlush ->
				$('#convertAsciiEmoji').show()
		else
			Tracker.afterFlush ->
				$('#convertAsciiEmoji').hide()

	@clearForm = ->
		@find('#language').value = localStorage.getItem('userLanguage')

	@save = ->
		instance = @
		data = {}

		reload = false
		selectedLanguage = $('#language').val()

		if localStorage.getItem('userLanguage') isnt selectedLanguage
			localStorage.setItem 'userLanguage', selectedLanguage
			data.language = selectedLanguage
			reload = true

		data.newRoomNotification = $('input[name=newRoomNotification]:checked').val()
		data.newMessageNotification = $('input[name=newMessageNotification]:checked').val()
		data.useEmojis = $('input[name=useEmojis]:checked').val()
		data.convertAsciiEmoji = $('input[name=convertAsciiEmoji]:checked').val()
		data.saveMobileBandwidth = $('input[name=saveMobileBandwidth]:checked').val()
		data.collapseMediaByDefault = $('input[name=collapseMediaByDefault]:checked').val()
		data.viewMode = parseInt($('#viewMode').find('select').val())
		data.hideUsernames = $('#hideUsernames').find('input:checked').val()
		data.hideAvatars = $('#hideAvatars').find('input:checked').val()
		data.mergeChannels = $('#mergeChannels').find('input:checked').val()
		data.unreadRoomsMode = $('input[name=unreadRoomsMode]:checked').val()
		data.autoImageLoad = $('input[name=autoImageLoad]:checked').val()
		data.emailNotificationMode = $('select[name=emailNotificationMode]').val()
		data.highlights = _.compact(_.map($('[name=highlights]').val().split(','), (e) -> return _.trim(e)))

		Meteor.call 'saveUserPreferences', data, (error, results) ->
			if results
				toastr.success t('Preferences_saved')
				instance.clearForm()
				if reload
					setTimeout ->
						Meteor._reload.reload()
					, 1000

			if error
				handleError(error)

Template.accountPreferences.onRendered ->
	Tracker.afterFlush ->
		SideNav.setFlex "accountFlex"
		SideNav.openFlex()

Template.accountPreferences.events
	'click .submit button': (e, t) ->
		t.save()

	'change input[name=useEmojis]': (e, t) ->
		t.useEmojis.set $(e.currentTarget).val() is '1'

	'click .enable-notifications': ->
		KonchatNotification.getDesktopPermission()

	'click .test-notifications': ->
		KonchatNotification.notify
			payload:
				sender:
					username: 'rocket.cat'
			title: TAPi18n.__('Desktop_Notification_Test')
			text: TAPi18n.__('This_is_a_desktop_notification')

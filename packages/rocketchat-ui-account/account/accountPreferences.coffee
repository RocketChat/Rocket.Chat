Template.accountPreferences.helpers
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
		return Meteor.user()?.settings?.preferences?['highlights'].join(', ')

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

	@save = ->
		instance = @
		data = {}

		data.disableNewRoomNotification = $('input[name=disableNewRoomNotification]:checked').val()
		data.disableNewMessageNotification = $('input[name=disableNewMessageNotification]:checked').val()
		data.useEmojis = $('input[name=useEmojis]:checked').val()
		data.convertAsciiEmoji = $('input[name=convertAsciiEmoji]:checked').val()
		data.saveMobileBandwidth = $('input[name=saveMobileBandwidth]:checked').val()
		data.compactView = $('input[name=compactView]:checked').val()
		data.unreadRoomsMode = $('input[name=unreadRoomsMode]:checked').val()
		data.autoImageLoad = $('input[name=autoImageLoad]:checked').val()
		data.emailNotificationMode = $('select[name=emailNotificationMode]').val()
		data.highlights = _.collect($('[name=highlights]').val().split(','), (e) -> return _.trim(e))

		Meteor.call 'saveUserPreferences', data, (error, results) ->
			if results
				toastr.success t('Preferences_saved')
				instance.clearForm()

			if error
				toastr.error error.reason

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
		KonchatNotification._showDesktop
			payload:
				sender:
					username: 'rocket.cat'
			title: TAPi18n.__('Desktop_Notification_Test')
			text: TAPi18n.__('This_is_a_desktop_notification')

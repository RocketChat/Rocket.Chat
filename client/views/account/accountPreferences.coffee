Template.accountPreferences.helpers
	checked: (property, value) ->
		currentValue = !!Meteor.user()?.settings?.preferences?[property]
		return currentValue is value

Template.accountPreferences.onCreated ->
	settingsTemplate = this.parentTemplate(3)
	settingsTemplate.child ?= []
	settingsTemplate.child.push this

	@clearForm = ->
		
	@save = ->
		instance = @
		data = {}

		data.disableNewRoomNotification = $('input[name=disableNewRoomNotification]:checked').val()
		data.disableNewMessageNotification = $('input[name=disableNewMessageNotification]:checked').val()
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

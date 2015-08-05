Template.userStatus.helpers
	myUserInfo: ->
		visualStatus = "custom"
		username = Meteor.user()?.username
		switch Session.get('user_' + username + '_status')
			when "online"
				visualStatus = t("online")
			when "away"
				visualStatus = t("away")
			when "busy"
				visualStatus = t("busy")
			when "offline"
				visualStatus = t("invisible")
		return {
			name: Session.get('user_' + username + '_name')
			status: Session.get('user_' + username + '_status')
			visualStatus: visualStatus
			_id: Meteor.userId()
			username: username
		}
	customMessage: ->
		return 'custom message'

Template.userStatus.events
	'click .options .status': (event) ->
		event.preventDefault()
		if event.currentTarget.dataset.status is 'custom'
			event.stopPropagation()
			$('.custom-message').css('display','block')
		else
			AccountBox.setStatus(event.currentTarget.dataset.status)

	'click .account-box': (event) ->
		console.log '.account-box EVENT....'
		if $('.custom-message').css('display') isnt 'block'
			AccountBox.toggle()

	'click #logout': (event) ->
		event.preventDefault()
		user = Meteor.user()
		Meteor.logout ->
			Meteor.call('logoutCleanUp', user)

	'click #avatar': (event) ->
		Meteor.call('resetAvatar')

	'click #settings': (event) ->
		SideNav.setFlex "userSettingsFlex"
		setTimeout ->
			SideNav.openFlex()
		, 125

	'click .save-message': (event, instance) ->
		t = $('#custom-message-text').val()
		console.log 'Save Custom Message ' + t
		AccountBox.setStatus('custom')
		# TODO: where to save: $('#custom-message-text').val()
		Meteor.users.update({_id: userId, statusDefault: {$ne: status}}, {$set: {status: status, statusDefault: status}});

		$('.custom-message').css('display','none')

	'click .cancel-message': (event, instance) ->
		event.preventDefault()
		event.stopPropagation()
		$('.custom-message').css('display','none')

Template.userStatus.rendered = ->
	AccountBox.init()
	$('.custom-message').css('display','none')


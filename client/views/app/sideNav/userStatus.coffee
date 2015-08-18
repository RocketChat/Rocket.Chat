Template.userStatus.helpers
	myUserInfo: ->
		visualStatus = t("online")
		username = Meteor.user()?.username
		switch Session.get('user_' + username + '_status')
			when "away"
				visualStatus = t("away")
			when "busy"
				visualStatus = t("busy")
			when "offline"
				visualStatus = t("invisible")
		visualStatus = capitalizeWord(visualStatus)
		return {
			name: Meteor.user()?.name || username
			status: Session.get('user_' + username + '_status')
			customMessage : ->
				message = ''
				status = Session.get('user_' + username + '_status')
				if Meteor.user()? and status?
					username = Meteor.user().username
					if status in ['online','away', 'busy']
						$('.custom-message').css('display','block')
						statusMessages = Session.get('user_' + username + '_statusMessages')
						if (statusMessages?)
							message = statusMessages[status]
				return message
			visualStatus: visualStatus
			_id: Meteor.userId()
			username: username
		}

Template.userStatus.events
	'click .options .status': (event) ->
		event.preventDefault()
		newStatus = event.currentTarget.dataset.status
		setStatusMessage( Session.get('user_' + Meteor.user().username + '_statusMessages'), newStatus)
		if newStatus in ['online','away', 'busy']
			event.stopPropagation()
		else
			$('.custom-message').css('display','none')
			AccountBox.setStatus(newStatus, null)

	'click .account-box': (event) ->
		#console.log '.account-box EVENT....'
		if $('.custom-message').css('display') is 'none'
			AccountBox.toggle()

	'click #logout': (event) ->
		event.preventDefault()
		user = Meteor.user()
		Meteor.logout ->
			FlowRouter.go 'home'
			Meteor.call('logoutCleanUp', user)

	'click #avatar': (event) ->
		FlowRouter.go 'changeAvatar'

	'click #settings': (event) ->
		SideNav.setFlex "userSettingsFlex"
		setTimeout ->
			SideNav.openFlex()
		, 125

	'click .save-message': (event, instance) ->
		cmt = $('.custom-message')
		AccountBox.setStatus(cmt.data('userStatus'), $('#custom-message-text').val())
		cmt.css('display','none')

	'click .cancel-message': (event, instance) ->
		event.preventDefault()
		event.stopPropagation()
		$('.custom-message').css('display','none')

Template.userStatus.rendered = ->
	AccountBox.init()
	username = Meteor.user()?.username
	setStatusMessage(Session.get('user_' + username + '_statusMessages'), Session.get('user_' + username + '_status'))
	$('.custom-message').css('display','none')

capitalizeWord = (word) ->
	word[0].toUpperCase() + word[1..].toLowerCase()

setStatusMessage = (statusMessages, newStatus) ->
	jCM = $('.custom-message')
	if newStatus in ['online','away', 'busy']
		jCM.data('userStatus',newStatus).css('display','block').removeClass('status-online status-busy status-offline status-away').addClass('status-' + newStatus)
		$('#label-custom-message').text(capitalizeWord(newStatus) + ' custom message')
		if statusMessages?
			message = statusMessages[newStatus]
		else
			message = ''
		$('#custom-message-text').val(message)
	else
		jCM.css('display', 'none')

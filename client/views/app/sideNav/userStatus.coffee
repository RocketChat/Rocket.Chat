Template.userStatus.helpers
	myUserInfo: ->
		visualStatus = "online"
		username = Meteor.user()?.username
		switch Session.get('user_' + username + '_status')
			when "away"
				visualStatus = t("away")
			when "busy"
				visualStatus = t("busy")
			when "offline"
				visualStatus = t("invisible")
		return {
			name: Session.get('user_' + username + '_name')
			status: Session.get('user_' + username + '_status')
			statusMessage : Session.get('user_' + username + '_statusMessage')
			visualStatus: visualStatus
			_id: Meteor.userId()
			username: username
		}
	customMessage: ->
		username = Meteor.user()?.username
		return Session.get('user_' + username + '_statusMessage')

Template.userStatus.events
	'click .options .status': (event) ->
		event.preventDefault()
		event.stopPropagation()
		setStatusMessage(event.currentTarget.dataset.status)

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
	setStatusMessage(Session.get('user_' + username + '_status'))
	$('.custom-message').css('display','none') #.val(Session.get('user_' + username + '_statusMessage'))


setStatusMessage = (newStatus) ->
	status = $('a.status.' + newStatus)
	cm = $('.custom-message').detach()
	status.parent().append(cm)
	colorClass = 'status-' + newStatus
	cm.data('userStatus',newStatus)
	cm.css('display','block').removeClass('status-online status-busy status-offline status-away').addClass(colorClass)

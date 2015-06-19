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
			visualStatus: visualStatus
			_id: Meteor.userId()
			username: username
		}

Template.userStatus.events
	'click .options .status': (event) ->
		event.preventDefault()
		AccountBox.setStatus(event.currentTarget.dataset.status)

	'click .account-box': (event) ->
		AccountBox.toggle()

	'click #logout': (event) ->
		event.preventDefault()
		Meteor.logout()

	'click #avatar': (event) ->
		Meteor.call('resetAvatar')

	'click #settings': (event) ->
		SideNav.setFlex "userSettingsFlex"
		setTimeout ->
			SideNav.openFlex()
		, 125

Template.userStatus.rendered = ->
	AccountBox.init()

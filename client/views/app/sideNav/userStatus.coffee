Template.userStatus.helpers
	myUserInfo: ->
		visualStatus = "online"
		switch Session.get('user_' + Meteor.userId() + '_status')
			when "away"
				visualStatus = t("userStatus.away")
			when "busy"
				visualStatus = t("userStatus.busy")
			when "offline"
				visualStatus = t("userStatus.invisible")
		return {
			name: Session.get('user_' + Meteor.userId() + '_name')
			status: Session.get('user_' + Meteor.userId() + '_status')
			visualStatus: visualStatus
			_id: Meteor.userId()
			username: Meteor.user().username
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

Template.userStatus.rendered = ->
	AccountBox.init()

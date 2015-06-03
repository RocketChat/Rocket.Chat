Template.userImageProfile.helpers
	userStatus: ->
		return 'status-' + Session.get('user_' + this + '_status')

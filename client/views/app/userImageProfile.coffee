Template.userImageProfile.helpers
	userName: ->
		return Session.get('user_' + this._id + '_name')

	userStatus: ->
		return 'status-' + Session.get('user_' + this._id + '_status')

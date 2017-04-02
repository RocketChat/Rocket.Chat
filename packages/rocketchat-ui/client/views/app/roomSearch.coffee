Template.roomSearch.helpers
	roomIcon: ->
		return 'icon-at' if this.type is 'u'

		if this.type is 'r'
			return RocketChat.roomTypes.getIcon this.t

	userStatus: ->
		if this.type is 'u'
			return 'status-' + this.status

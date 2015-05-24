Template.roomSearch.helpers
	roomIcon: ->
		return 'icon-user' if this.type is 'u'

		if this.type is 'r'
			switch this.t
				when 'd' then return 'icon-user'
				when 'g' then return 'icon-users'

	userStatus: ->
		if this.type is 'u'
			return 'status-' + this.status
		else if this.t is 'v'
			return 'status-offline'

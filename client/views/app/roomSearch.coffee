Template.roomSearch.helpers
	roomIcon: ->
		return 'icon-at' if this.type is 'u'

		if this.type is 'r'
			switch this.t
				when 'd' then return 'icon-at'
				when 'g' then return 'icon-hash'

	userStatus: ->
		if this.type is 'u'
			return 'status-' + this.status
		else if this.t is 'v'
			return 'status-offline'

Template.roomSearch.helpers
	roomIcon: ->
		return 'icon-at' if this.type is 'u'

		if this.type is 'r'
			switch this.t
				when 'd' then return 'icon-at'
				when 'c' then return 'icon-hash'
				when 'p' then return 'icon-lock'

	userStatus: ->
		if this.type is 'u'
			return 'status-' + this.status

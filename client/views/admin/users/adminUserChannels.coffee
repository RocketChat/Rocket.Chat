Template.adminUserChannels.helpers
	type: ->
		return if @t is 'd' then 'at' else if @t is 'p' then 'lock' else 'hash'
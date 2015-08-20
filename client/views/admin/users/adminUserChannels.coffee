Template.adminUserChannels.helpers
	type: ->
		return if @t is 'd' then 'at' else if @t is 'p' then 'lock' else 'hash'
	route: ->
		return switch @t
			when 'd'
				FlowRouter.path('direct', {username: @name})
			when 'p'
				FlowRouter.path('group', {name: @name})
			when 'c'
				FlowRouter.path('channel', {name: @name})

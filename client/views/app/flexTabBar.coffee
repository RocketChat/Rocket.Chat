Template.flexTabBar.helpers
	active: ->
		return 'active' if @template is RocketChat.TabBar.getTemplate() and RocketChat.TabBar.isFlexOpen()
	buttons: ->
		return RocketChat.TabBar.getButtons()

Template.flexTabBar.events
	'click .tab-button': (e, t) ->
		e.preventDefault()

		if RocketChat.TabBar.isFlexOpen() and RocketChat.TabBar.getTemplate() is $(e.currentTarget).data('template')
			RocketChat.TabBar.closeFlex()
		else
			RocketChat.TabBar.setTemplate $(e.currentTarget).data('template'), ->
				$('.flex-tab')?.find("input[type='text']:first")?.focus()

		# if Session.get('flexOpened') and Session.equals('whichFlexOpened', $(e.currentTarget).data('target'))
		# 	Session.set('rtcLayoutmode', 0)
		# 	Session.set('flexOpened',false)
		# 	Session.set('whichFlexOpened')
		# else
		# 	$(e.currentTarget).addClass 'active'
		# 	Session.set('flexOpened', true)
		# 	Session.set('whichFlexOpened', $(e.currentTarget).data('target'))

		# # $('.user-info-content').hide()
		# # $($(e.currentTarget).attr('href')).show()

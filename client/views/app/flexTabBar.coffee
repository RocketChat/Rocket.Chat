Template.flexTabBar.events
	'click .tab-button': (e, t) ->
		e.preventDefault()

		if FlexTab.isOpen() and FlexTab.getFlex().template is $(e.currentTarget).data('target')
			FlexTab.closeFlex()
		else
			FlexTab.setFlex $(e.currentTarget).data('target'), {}, ->
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

Template.flexTabBar.events
	'click .tab-button': (e, t) ->
		e.preventDefault()

		$('.tab-button').removeClass 'active'

		if FlexTab.getFlex().template is $(e.currentTarget).data('target')
			FlexTab.setFlex ''
			FlexTab.closeFlex()
		else
			$(e.currentTarget).addClass 'active'
			FlexTab.setFlex $(e.currentTarget).data('target')
			FlexTab.openFlex()

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

Template.flexTabBar.onCreated ->
	FlexTab.init()
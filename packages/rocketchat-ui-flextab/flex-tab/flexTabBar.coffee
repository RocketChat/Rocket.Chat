Template.flexTabBar.helpers
	active: ->
		return 'active' if @template is RocketChat.TabBar.getTemplate() and RocketChat.TabBar.isFlexOpen()
	buttons: ->
		RocketChat.TabBar.getButtons()
		return RocketChat.TabBar.getButtons()
	title: ->
		return t(@i18nTitle) or @title

Template.flexTabBar.events
	'click .tab-button': (e, t) ->
		e.preventDefault()

		if RocketChat.TabBar.isFlexOpen() and RocketChat.TabBar.getTemplate() is $(e.currentTarget).data('template')
			RocketChat.TabBar.closeFlex()
			$('.flex-tab').css('max-width', '')
		else
			width = $(e.currentTarget).data('width')

			if width?
				$('.flex-tab').css('max-width', "#{width}px")
			else
				$('.flex-tab').css('max-width', '')

			RocketChat.TabBar.setTemplate $(e.currentTarget).data('template'), ->
				$('.flex-tab')?.find("input[type='text']:first")?.focus()
				$('.flex-tab .content')?.scrollTop(0)

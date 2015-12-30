Template.flexTabBar.helpers
	active: ->
		return 'active' if @template is RocketChat.TabBar.getTemplate() and RocketChat.TabBar.isFlexOpen()
	buttons: ->
		RocketChat.TabBar.getButtons()
		return RocketChat.TabBar.getButtons()
	title: ->
		return t(@i18nTitle) or @title
	visible: ->
		if @groups.indexOf(RocketChat.TabBar.getVisibleGroup()) is -1
			# if it was active, close it
			if @template is RocketChat.TabBar.getTemplate() and RocketChat.TabBar.isFlexOpen()
				RocketChat.TabBar.closeFlex()
			return 'hidden'

Template.flexTabBar.events
	'click .tab-button': (e, t) ->
		e.preventDefault()

		if RocketChat.TabBar.isFlexOpen() and RocketChat.TabBar.getTemplate() is @template
			RocketChat.TabBar.closeFlex()
			$('.flex-tab').css('max-width', '')
		else
			if @width?
				$('.flex-tab').css('max-width', "#{@width}px")
			else
				$('.flex-tab').css('max-width', '')

			RocketChat.TabBar.setTemplate @template, ->
				$('.flex-tab')?.find("input[type='text']:first")?.focus()
				$('.flex-tab .content')?.scrollTop(0)

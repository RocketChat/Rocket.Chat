Template.flexTabBar.helpers
	active: ->
		return 'active' if @template is RocketChat.TabBar.getTemplate() and RocketChat.TabBar.isFlexOpen()
	buttons: ->
		return RocketChat.TabBar.getButtons()
	title: ->
		return t(@i18nTitle) or @title
	visible: ->
		if @groups.indexOf(RocketChat.TabBar.getVisibleGroup()) is -1
			return 'hidden'

Template.flexTabBar.events
	'click .tab-button': (e, t) ->
		e.preventDefault()

		if RocketChat.TabBar.isFlexOpen() and RocketChat.TabBar.getTemplate() is @template
			RocketChat.TabBar.closeFlex()
			$('.flex-tab').css('max-width', '')
			$('.main-content').css('right', '40px')
		else
			if not @openClick? or @openClick(e,t)
				if @width?
					$('.flex-tab').css('max-width', "#{@width}px")
					$('.main-content').css('right', "#{@width + 40}px")
				else
					$('.flex-tab').css('max-width', '')

				RocketChat.TabBar.setTemplate @template, ->
					$('.flex-tab')?.find("input[type='text']:first")?.focus()
					$('.flex-tab .content')?.scrollTop(0)

Template.flexTabBar.onCreated ->
	# close flex if the visible group changed and the opened template is not in the new visible group
	@autorun =>
		visibleGroup = RocketChat.TabBar.getVisibleGroup()

		Tracker.nonreactive =>
			openedTemplate = RocketChat.TabBar.getTemplate()
			exists = false
			RocketChat.TabBar.getButtons().forEach (button) ->
				if button.groups.indexOf(visibleGroup) isnt -1 and openedTemplate is button.template
					exists = true

			unless exists
				RocketChat.TabBar.closeFlex()

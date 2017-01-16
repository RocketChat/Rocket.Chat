Template.flexTabBar.helpers
	active: ->
		return 'active' if @template is Template.instance().tabBar.getTemplate() and Template.instance().tabBar.getState() is 'opened'
	buttons: ->
		return RocketChat.TabBar.getButtons()
	title: ->
		return t(@i18nTitle) or @title
	visible: ->
		if @groups.indexOf(Template.instance().tabBar.currentGroup()) is -1
			return 'hidden'
	opened: ->
		return Template.instance().tabBar.getState()
	template: ->
		return Template.instance().tabBar.getTemplate()
	flexData: ->
		return Object.assign (Template.currentData().data || {}), {
			tabBar: Template.instance().tabBar
		}

Template.flexTabBar.events
	'click .tab-button': (e, instance) ->
		e.preventDefault()

		if instance.tabBar.getState() is 'opened' and instance.tabBar.getTemplate() is @template
			instance.tabBar.close()
		else
			instance.tabBar.open(@)

Template.flexTabBar.onCreated ->
	@tabBar = Template.currentData().tabBar

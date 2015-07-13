Template.settings.helpers
	tSearchSettings: ->
		return t('Search_settings')
	groups: ->
		return Settings.find({type: 'group'}).fetch()
	group: ->
		return Settings.findOne { _id: @group, type: 'group' }
	settings: ->
		return Settings.find({ group: @group, type: 'variable' }).fetch()

Template.settings.events
	"click .burger": ->
		chatContainer = $("#rocket-chat")
		if chatContainer.hasClass("menu-closed")
			chatContainer.removeClass("menu-closed").addClass("menu-opened")
		else
			chatContainer.addClass("menu-closed").removeClass("menu-opened")

	"click .flex-tab .more": (event) ->
		console.log 'settings click .flex-tab .more' if window.rocketDebug
		Session.set('flexOpened', !Session.get('flexOpened'))

Template.settings.onRendered ->
	console.log 'room.onRendered' if window.rocketDebug
	Session.set 'flexOpened', true
	FlexTab.check()
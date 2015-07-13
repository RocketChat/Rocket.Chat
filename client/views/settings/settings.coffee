Template.settings.helpers
	tSearchSettings: ->
		return t('Search_settings')
	settingsTemplate: ->
		if @page and Template["settings-#{@page}"]?
			return "settings-#{@page}"
		return "settings-authentication"

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
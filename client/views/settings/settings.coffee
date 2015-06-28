Template.settings.helpers
	tSearchSettings: ->
		return t('Search_settings')
	arrowPosition: ->
		console.log 'settings.helpers arrowPosition' if window.rocketDebug
		return 'left' unless Session.equals('flexOpened', true)
	flexOpened: ->
		console.log 'settings.helpers flexOpened' if window.rocketDebug
		return 'opened' if Session.equals('flexOpened', true)
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
Template.home.helpers
	arrowPosition: ->
		return 'left' unless Session.equals('flexOpened', true)
	flexOpened: ->
		return 'opened' if Session.equals('flexOpened', true)
	withParagraph: ->
		return {
			withParagraph: true
		}

Template.home.events
	"click .flex-tab .more": (event) ->
		Session.set('flexOpened', !Session.get('flexOpened'))

	"click .burger": ->
		chatContainer = $("#rocket-chat")
		if chatContainer.hasClass("menu-closed")
			chatContainer.removeClass("menu-closed").addClass("menu-opened")
		else
			chatContainer.addClass("menu-closed").removeClass("menu-opened")


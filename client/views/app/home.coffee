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


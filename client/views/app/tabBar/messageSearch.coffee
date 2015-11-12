Template.messageSearch.helpers
	tSearchMessages: ->
		return t('Search_Messages')

	searchResultMessages: ->
		return Template.instance().searchResult.get()?.messages

Template.messageSearch.events
	"keydown #message-search": (e) ->
		if e.keyCode is 13
			e.preventDefault()

	"keyup #message-search": _.debounce (e, t) ->
		value = e.target.value.trim()
		if value is '' and t.currentSearchTerm
			t.currentSearchTerm = ''
			t.searchResult.set undefined
			return
		else if value is t.currentSearchTerm
			return

		Tracker.nonreactive ->
			Meteor.call 'messageSearch', value, Session.get('openedRoom'), (error, result) ->
				if result? and (result.messages?.length > 0 or result.users?.length > 0 or result.channels?.length > 0)
					t.searchResult.set result
					t.currentSearchTerm = value
	, 500

Template.messageSearch.onCreated ->
	this.currentSearchTerm = ''
	this.searchResult = new ReactiveVar

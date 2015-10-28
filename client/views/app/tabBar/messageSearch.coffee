Template.messageSearch.helpers
	tSearchMessages: ->
		return t('Search_Messages')
	
	searchResult: ->
		return Template.instance().searchResult.get()

Template.messageSearch.events
	"keydown #message-search": (e) ->
		if e.keyCode is 13
			e.preventDefault()

	"keyup #message-search": _.debounce (e, t) ->
		t.searchResult.set undefined
		value = e.target.value.trim()
		if value is ''
			return

		Tracker.nonreactive ->
			Meteor.call 'messageSearch', value, Session.get('openedRoom'), (error, result) ->
				if result? and (result.messages?.length > 0 or result.users?.length > 0 or result.channels?.length > 0)
					t.searchResult.set result
	, 1000

Template.messageSearch.onCreated ->
	this.searchResult = new ReactiveVar

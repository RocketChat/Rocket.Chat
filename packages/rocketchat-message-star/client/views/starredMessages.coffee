Template.starredMessages.helpers
	hasMessages: ->
		return StarredMessage.find({ rid: Session.get 'openedRoom' }, { sort: { ts: -1 } }).count() > 0

	messages: ->
		return StarredMessage.find { rid: Session.get 'openedRoom' }, { sort: { ts: -1 } }

	notReadySubscription: ->
		return 'notready' unless Template.instance().subscriptionsReady()

Template.starredMessages.onCreated ->
	this.autorun =>
		this.subscribe 'starredMessages', Session.get('openedRoom')

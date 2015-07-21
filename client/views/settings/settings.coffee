Template.settings.helpers
	isAdmin: ->
		return Meteor.user().admin is true
	groups: ->
		return Settings.find({type: 'group'}).fetch()
	group: ->
		group = FlowRouter.getParam('group')
		group ?= Settings.findOne({ type: 'group' })?._id
		return Settings.findOne { _id: group, type: 'group' }
	settings: ->
		group = FlowRouter.getParam('group')
		group ?= Settings.findOne({ type: 'group' })?._id
		return Settings.find({ group: group }).fetch()
	flexOpened: ->
		return 'opened' if Session.equals('flexOpened', true)
	arrowPosition: ->
		console.log 'room.helpers arrowPosition' if window.rocketDebug
		return 'left' unless Session.equals('flexOpened', true)
	label: ->
		return TAPi18next.t @i18nLabel

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

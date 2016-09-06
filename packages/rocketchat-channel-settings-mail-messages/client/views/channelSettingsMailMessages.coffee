Template.channelSettingsMailMessages.helpers
	canSendEmail: ->
		return FlowRouter.getRouteName() isnt 'admin-rooms'

Template.channelSettingsMailMessages.events
	'click button.mail-messages': (e, t) ->
		Session.set 'channelSettingsMailMessages', Session.get('openedRoom')
		RocketChat.TabBar.setTemplate('mailMessagesInstructions')
		view = Blaze.getView($('.messages-box')[0])
		view?.templateInstance?().resetSelection?(true)

Template.channelSettingsMailMessages.onCreated ->
	view = Blaze.getView($('.messages-box')[0])
	view?.templateInstance?().resetSelection?(false)

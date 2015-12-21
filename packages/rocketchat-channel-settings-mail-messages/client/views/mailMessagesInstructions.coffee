Template.mailMessagesInstructions.events
	'click .cancel': (e, t) ->
		RocketChat.TabBar.setTemplate('channelSettings')
		view = Blaze.getView($('.messages-box')[0])
		view?.templateInstance?().resetSelection(false)

	'click .send': (e, t) ->
		console.log 'sending'

Template.mailMessagesInstructions.onCreated ->
	@autorun =>
		if Session.get('channelSettingsMailMessages') isnt Session.get('openedRoom')
			RocketChat.TabBar.setTemplate('channelSettings')

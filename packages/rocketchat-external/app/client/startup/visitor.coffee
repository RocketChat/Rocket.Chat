@visitorId = new ReactiveVar null

Meteor.startup ->
	if not localStorage.getItem('rocketChatExternal')?
		localStorage.setItem('rocketChatExternal', Random.id())

	visitorId.set localStorage.getItem('rocketChatExternal')

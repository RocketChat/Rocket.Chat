@visitorId = new ReactiveVar null

Meteor.startup ->
	if not localStorage.getItem('rocketChatLivechat')?
		localStorage.setItem('rocketChatLivechat', Random.id())

	visitorId.set localStorage.getItem('rocketChatLivechat')

@visitorId = new ReactiveVar null

Meteor.startup ->
	if not localStorage.getItem('rocketChatLivechat')?
		localStorage.setItem('rocketChatLivechat', Random.id())
	else
		Tracker.autorun (c) ->
			if not Meteor.userId() and visitor.getToken()
				Meteor.call 'livechat:loginByToken', visitor.getToken(), (err, result) ->
					if result?.token
						Meteor.loginWithToken result.token, (err, result) ->
							c.stop()

	visitorId.set localStorage.getItem('rocketChatLivechat')

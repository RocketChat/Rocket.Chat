Meteor.startup ->
	$(window).on 'focus', ->
		if FlowRouter.getRouteName() in ['channel', 'group', 'direct']
			rid = Session.get 'openedRoom'
			if rid?
				subscription = ChatSubscription.findOne rid: rid
				if subscription? and (subscription.alert is true or subscription.unread > 0)
					Meteor.call 'readMessages', rid
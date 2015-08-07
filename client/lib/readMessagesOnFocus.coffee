Meteor.startup ->
	$(window).on 'focus', ->
		if FlowRouter.getRouteName() is 'room'
			rid = FlowRouter.getParam '_id'
			if rid?
				subscription = ChatSubscription.findOne rid: rid
				if subscription? and (subscription.alert is true or subscription.unread > 0)
					Meteor.call 'readMessages', rid
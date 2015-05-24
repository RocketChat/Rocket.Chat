Template.chatRooms.helpers
	roomData: ->
		return Session.get('roomData' + this.rid)

	recentRooms: ->
		filter =
			uid: Meteor.userId()
			t: { $in: ['d', 'g'] }
			f: { $not: true }
			$or: [
				{ unread: { $gte: 1 } }
				{ ts: { $gte: moment().subtract(1, 'days').startOf('day').toDate() } }
			]
		return ChatSubscription.find filter, { sort: 'rn': 1 }

	favoriteRooms: ->
		return ChatSubscription.find { uid: Meteor.userId(), t: { $in: ['d', 'g']}, f: true }, { sort: 'rn': 1 }

Template.chatRooms.events

	"click .rooms-box h3": (event)->
		ul = $(event.currentTarget).next('ul')
		if ul.is(":visible") then ul.hide() else ul.show()

	"click .rooms-box a": ->
		$("#rocket-chat").addClass("menu-closed").removeClass("menu-opened")

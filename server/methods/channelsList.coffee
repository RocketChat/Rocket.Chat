Meteor.methods
	channelsList: ->
		return { channels: ChatRoom.find({ t: 'c' }, { sort: { msgs:-1 } }).fetch() }

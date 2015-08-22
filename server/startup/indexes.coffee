Meteor.startup ->
	Meteor.defer ->
		try ChatRoom._ensureIndex { 'name': 1 }, { unique: 1, sparse: 1 } catch e then console.log e
		try ChatRoom._ensureIndex { 'u._id': 1 } catch e then console.log e

		try ChatSubscription._ensureIndex { 'rid': 1, 'u._id': 1 }, { unique: 1 } catch e then console.log e
		try ChatSubscription._ensureIndex { 'u._id': 1, 'name': 1, 't': 1 }, { unique: 1 } catch e then console.log e
		try ChatSubscription._ensureIndex { 'open': 1 } catch e then console.log e
		try ChatSubscription._ensureIndex { 'alert': 1 } catch e then console.log e
		try ChatSubscription._ensureIndex { 'unread': 1 } catch e then console.log e
		try ChatSubscription._ensureIndex { 'ts': 1 } catch e then console.log e

		try ChatMessage._ensureIndex { 'rid': 1, 'ts': 1 } catch e then console.log e
		try ChatMessage._ensureIndex { 'ets': 1 }, { sparse: 1 } catch e then console.log e
		try ChatMessage._ensureIndex { 'rid': 1, 't': 1, 'u._id': 1 } catch e then console.log e
		try ChatMessage._ensureIndex { 'expireAt': 1 }, { expireAfterSeconds: 0 } catch e then console.log e
		try ChatMessage._ensureIndex { '_hidden': 1 }, { sparse: 1 } catch e then console.log e

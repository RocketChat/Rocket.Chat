Meteor.startup ->
	Meteor.defer ->
		try ChatMessage._ensureIndex { 'starred._id': 1 }, { sparse: 1 } catch e then console.log e

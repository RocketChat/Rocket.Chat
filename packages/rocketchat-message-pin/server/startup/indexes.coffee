Meteor.startup ->
	Meteor.defer ->
		RocketChat.models.Messages.tryEnsureIndex { 'pinnedBy._id': 1 }, { sparse: 1 }

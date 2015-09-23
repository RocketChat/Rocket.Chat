Meteor.startup ->
	Meteor.defer ->
		RocketChat.models.Messages.tryEnsureIndex { 'starred._id': 1 }, { sparse: 1 }

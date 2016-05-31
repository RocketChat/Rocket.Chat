Meteor.methods({
	groupsList: function(nameFilter, limit, sort) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'groupsList' });
		}

		let options = {
			fields: { name: 1 },
			sort: { msgs: -1 }
		};

		//Verify the limit param is a number
		if (_.isNumber(limit)) {
			options.limit = limit;
		}

		//Verify there is a sort option and it's a string
		if (_.trim(sort)) {
			switch (sort) {
				case 'name':
					options.sort = { name: 1 };
					break;
				case 'msgs':
					options.sort = { msgs: -1 };
					break;
			}
		}

		//Determine if they are searching or not, base it upon the name field
		if (nameFilter) {
			return { groups: RocketChat.models.Rooms.findByTypeAndNameContainingUsername('p', new RegExp(s.trim(s.escapeRegExp(nameFilter)), 'i'), Meteor.user().username, options).fetch() };
		} else {
			let roomIds = _.pluck(RocketChat.models.Subscriptions.findByTypeAndUserId('p', Meteor.userId()).fetch(), 'rid');
			return { groups: RocketChat.models.Rooms.findByIds(roomIds, options).fetch() };
		}
	}
});

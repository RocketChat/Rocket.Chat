Meteor.methods({
	groupsList(nameFilter, limit, sort) {

		check(nameFilter, Match.Optional(String));
		check(limit, Match.Optional(Number));
		check(sort, Match.Optional(String));

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'groupsList' });
		}

		const options = {
			fields: { name: 1 },
			sort: { name: 1 }
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
			const roomIds = _.pluck(RocketChat.models.Subscriptions.findByTypeAndUserId('p', Meteor.userId()).fetch(), 'rid');
			return { groups: RocketChat.models.Rooms.findByIds(roomIds, options).fetch() };
		}
	}
});

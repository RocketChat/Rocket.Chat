/* globals _ */
Meteor.methods({
	'getParentChannelList'({sort, limit}) {
		this.unblock();
		check(sort, Match.Optional(String));
		check(limit, Match.Optional(Number));

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'requestsList'
			});
		}

		const options = {
			fields: {
				name: 1,
				t: 1
			},
			sort: {
				msgs: -1
			}
		};

		if (_.isNumber(limit)) {
			options.limit = limit;
		}

		if (sort.trim) {
			switch (sort) {
				case 'name':
					options.sort = {
						name: 1
					};
					break;
				case 'msgs':
					options.sort = {
						msgs: -1
					};
			}
		}

		return {
			channels: RocketChat.models.Rooms.find({
				t: {
					$in: ['p', 'c']
				}
			}, options).fetch()
		};
	}
});

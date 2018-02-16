/* globals _ */
Meteor.methods({
	//adapted copy of server/methods/channelsList.js
	requestsList(filter, channelType, limit, sort) {
		this.unblock();

		check(filter, String);
		check(channelType, String);
		check(limit, Match.Optional(Number));
		check(sort, Match.Optional(String));

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

		if (_.trim(sort)) {
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

		const roomTypes = [];

		if (RocketChat.authz.hasPermission(Meteor.userId(), 'view-r-room')) {
			roomTypes.push({
				type: 'r'
			});
		}

		if (roomTypes.length) {
			if (filter) {
				return {
					channels: RocketChat.models.Rooms.findByNameContainingTypesWithUsername(filter, roomTypes, options).fetch()
				};
			}

			return {
				channels: RocketChat.models.Rooms.findContainingTypesWithUsername(roomTypes, options).fetch()
			};
		}

		return {
			channels: []
		};
	}
});

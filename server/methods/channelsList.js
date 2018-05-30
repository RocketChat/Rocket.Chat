import _ from 'underscore';
import s from 'underscore.string';

Meteor.methods({
	channelsList(filter, channelType, limit, sort) {
		this.unblock();

		check(filter, String);
		check(channelType, String);
		check(limit, Match.Optional(Number));
		check(sort, Match.Optional(String));

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'channelsList'
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

		if (s.trim(sort)) {
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

		if (channelType !== 'private') {
			if (RocketChat.authz.hasPermission(Meteor.userId(), 'view-c-room')) {
				roomTypes.push({
					type: 'c'
				});
			} else if (RocketChat.authz.hasPermission(Meteor.userId(), 'view-joined-room')) {
				const roomIds = _.pluck(RocketChat.models.Subscriptions.findByTypeAndUserId('c', Meteor.userId()).fetch(), 'rid');
				roomTypes.push({
					type: 'c',
					ids: roomIds
				});
			}
		}

		if (channelType !== 'public' && RocketChat.authz.hasPermission(Meteor.userId(), 'view-p-room')) {
			const user = Meteor.user();
			const userPref = RocketChat.getUserPreference(user, 'groupByType') && RocketChat.getUserPreference(user, 'roomsListExhibitionMode') === 'category';
			const globalPref = RocketChat.settings.get('UI_Merge_Channels_Groups');
			// needs to negate globalPref because userPref represents its opposite
			const groupByType = userPref !== undefined ? userPref : !globalPref;

			if (!groupByType) {
				roomTypes.push({
					type: 'p',
					username: user.username
				});
			}
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

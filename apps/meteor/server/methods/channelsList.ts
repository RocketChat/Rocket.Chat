import type { IRoom } from '@rocket.chat/core-typings';
import { Rooms, Subscriptions, Users } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import type { FindOptions } from 'mongodb';

import { hasPermissionAsync } from '../../app/authorization/server/functions/hasPermission';
import { settings } from '../../app/settings/server';
import { getUserPreference } from '../../app/utils/server/lib/getUserPreference';
import { trim } from '../../lib/utils/stringUtils';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		channelsList(filter: string, channelType: string, limit?: number, sort?: string): { channels: IRoom[] };
	}
}

Meteor.methods<ServerMethods>({
	async channelsList(filter, channelType, limit, sort) {
		check(filter, String);
		check(channelType, String);
		check(limit, Match.Optional(Number));
		check(sort, Match.Optional(String));

		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'channelsList',
			});
		}

		const options: FindOptions<IRoom> = {
			projection: {
				name: 1,
				t: 1,
			},
			sort: {
				msgs: -1,
			},
		};

		if (toString.call(limit) === '[object Number]') {
			options.limit = limit;
		}

		if (trim(sort)) {
			switch (sort) {
				case 'name':
					options.sort = {
						name: 1,
					};
					break;
				case 'msgs':
					options.sort = {
						msgs: -1,
					};
			}
		}

		let channels: IRoom[] = [];

		if (channelType !== 'private') {
			if (await hasPermissionAsync(userId, 'view-c-room')) {
				if (filter) {
					channels = channels.concat(await Rooms.findByTypeAndNameContaining('c', filter, options).toArray());
				} else {
					channels = channels.concat(await Rooms.findByType('c', options).toArray());
				}
			} else if (await hasPermissionAsync(userId, 'view-joined-room')) {
				const roomIds = (await Subscriptions.findByTypeAndUserId('c', userId, { projection: { rid: 1 } }).toArray()).map((s) => s.rid);
				if (filter) {
					channels = channels.concat(await Rooms.findByTypeInIdsAndNameContaining('c', roomIds, filter, options).toArray());
				} else {
					channels = channels.concat(await Rooms.findByTypeInIds('c', roomIds, options).toArray());
				}
			}
		}

		if (channelType !== 'public' && (await hasPermissionAsync(userId, 'view-p-room'))) {
			const user = await Users.findOne(userId, {
				projection: {
					'username': 1,
					'settings.preferences.sidebarGroupByType': 1,
				},
			});

			if (!user) {
				throw new Meteor.Error('error-invalid-user', 'Invalid user', {
					method: 'channelsList',
				});
			}

			const userPref = await getUserPreference(user, 'sidebarGroupByType');
			// needs to negate globalPref because userPref represents its opposite
			const groupByType = userPref !== undefined ? userPref : settings.get('UI_Group_Channels_By_Type');

			if (!groupByType) {
				const roomIds = (await Subscriptions.findByTypeAndUserId('p', userId, { projection: { rid: 1 } }).toArray()).map((s) => s.rid);
				if (filter) {
					channels = channels.concat(await Rooms.findByTypeInIdsAndNameContaining('p', roomIds, filter, options).toArray());
				} else {
					channels = channels.concat(await Rooms.findByTypeInIds('p', roomIds, options).toArray());
				}
			}
		}

		return {
			channels,
		};
	},
});

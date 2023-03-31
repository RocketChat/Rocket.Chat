import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Rooms } from '@rocket.chat/models';

import { Users } from '../../app/models/server';
import { canAccessRoomAsync } from '../../app/authorization/server';
import { settings } from '../../app/settings/server';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		canAccessRoom(rid: IRoom['_id'], userId: IUser['_id'], extraData?: Record<string, unknown>): (IRoom & { username?: string }) | boolean;
	}
}

if (['yes', 'true'].includes(String(process.env.ALLOW_CANACCESSROOM_METHOD).toLowerCase())) {
	console.warn('Method canAccessRoom is deprecated and will be removed after version 5.0');
	Meteor.methods<ServerMethods>({
		async canAccessRoom(rid, userId, extraData) {
			check(rid, String);
			check(userId, Match.Maybe(String));

			let user;

			if (userId) {
				user = Users.findOneById(userId, {
					fields: {
						username: 1,
					},
				});

				if (!user?.username) {
					throw new Meteor.Error('error-invalid-user', 'Invalid user', {
						method: 'canAccessRoom',
					});
				}
			}

			if (!rid) {
				throw new Meteor.Error('error-invalid-room', 'Invalid room', {
					method: 'canAccessRoom',
				});
			}

			const room = await Rooms.findOneById(rid);

			if (!room) {
				throw new Meteor.Error('error-invalid-room', 'Invalid room', {
					method: 'canAccessRoom',
				});
			}

			if (await canAccessRoomAsync(room, user, extraData)) {
				if (user) {
					return { ...room, username: user.username };
				}
				return room;
			}

			if (!userId && settings.get('Accounts_AllowAnonymousRead') === false) {
				throw new Meteor.Error('error-invalid-user', 'Invalid user', {
					method: 'canAccessRoom',
				});
			}

			return false;
		},
	});
}

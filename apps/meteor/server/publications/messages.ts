import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Messages } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import type { FindOptions } from 'mongodb';

import { canAccessRoomIdAsync } from '../../app/authorization/server/functions/canAccessRoom';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'messages/get': (
			rid: IRoom['_id'],
			options: { lastUpdate?: Date; latestDate?: Date; oldestDate?: Date; inclusive?: boolean; count?: number; unreads?: boolean },
		) => Promise<{
			updated: IMessage[];
			deleted: IMessage[];
		}>;
	}
}

Meteor.methods<ServerMethods>({
	async 'messages/get'(rid, { lastUpdate, latestDate = new Date(), oldestDate, inclusive = false, count = 20, unreads = false }) {
		check(rid, String);

		const fromId = Meteor.userId();

		if (!fromId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'messages/get',
			});
		}

		if (!rid) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'messages/get' });
		}

		if (!(await canAccessRoomIdAsync(rid, fromId))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'messages/get',
			});
		}

		const options: FindOptions<IMessage> = {
			sort: {
				ts: -1,
			},
		};

		if (lastUpdate instanceof Date) {
			return {
				updated: await Messages.findForUpdates(rid, lastUpdate, {
					sort: {
						ts: -1,
					},
				}).toArray(),
				deleted: await Messages.trashFindDeletedAfter(lastUpdate, { rid }, { ...options, projection: { _id: 1, _deletedAt: 1 } }).toArray(),
			};
		}

		return Meteor.callAsync('getChannelHistory', {
			rid,
			latest: latestDate,
			oldest: oldestDate,
			inclusive,
			count,
			unreads,
		});
	},
});

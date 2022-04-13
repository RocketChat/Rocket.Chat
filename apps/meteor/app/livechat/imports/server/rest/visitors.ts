import { check } from 'meteor/check';
import type { IMessage } from '@rocket.chat/core-typings';

import { API } from '../../../../api/server';
import { LivechatRooms } from '../../../../models/server';
import { Messages } from '../../../../models/server/raw';
import { normalizeMessagesForUser } from '../../../../utils/server/lib/normalizeMessagesForUser';
import { canAccessRoom } from '../../../../authorization/server';

API.v1.addRoute(
	'livechat/:rid/messages',
	{ authRequired: true, permissionsRequired: ['view-l-room'] },
	{
		async get() {
			check(this.urlParams, {
				rid: String,
			});

			const { offset, count } = this.getPaginationItems();
			const { sort } = this.parseJsonQuery();

			const room = LivechatRooms.findOneById(this.urlParams.rid);

			if (!room) {
				throw new Error('invalid-room');
			}

			if (!canAccessRoom(room, this.user)) {
				throw new Error('not-allowed');
			}

			const cursor = Messages.findLivechatClosedMessages(this.urlParams.rid, {
				sort: sort || { ts: -1 },
				skip: offset,
				limit: count,
			});

			const total = await cursor.count();

			const messages = (await cursor.toArray()) as IMessage[];

			return API.v1.success({
				messages: normalizeMessagesForUser(messages, this.userId),
				offset,
				count,
				total,
			});
		},
	},
);

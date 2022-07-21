import { check } from 'meteor/check';
import { Messages } from '@rocket.chat/models';

import { API } from '../../../../api/server';
import { LivechatRooms } from '../../../../models/server';
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

			const { cursor, totalCount } = Messages.findLivechatClosedMessages(this.urlParams.rid, {
				sort: sort || { ts: -1 },
				skip: offset,
				limit: count,
			});

			const [messages, total] = await Promise.all([cursor.toArray(), totalCount]);

			return API.v1.success({
				messages: normalizeMessagesForUser(messages, this.userId),
				offset,
				count,
				total,
			});
		},
	},
);

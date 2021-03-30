import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { LivechatRooms, LivechatInquiry, Messages, Users, LivechatVisitors } from '../../../../../app/models/server';
import { RoutingManager } from '../../../../../app/livechat/server/lib/RoutingManager';
import { callbacks } from '../../../../../app/callbacks/server';

const resolveOnHoldCommentInfo = (options: { clientAction: boolean }, room: any): { comment: string; onHoldChatResumedBy: any} => {
	let comment = '';
	let onHoldChatResumedBy;
	if (options.clientAction) {
		const user = Meteor.user() as any;
		onHoldChatResumedBy = { _id: user._id, username: user.username, name: user.name };

		comment = TAPi18n.__('livechat_on_hold_chat_manually', { user: onHoldChatResumedBy.name || onHoldChatResumedBy.username });
	} else {
		const { v: { _id: visitorId } } = room;
		const visitor = LivechatVisitors.findOneById(visitorId, { name: 1, username: 1 });
		if (!visitor) {
			throw new Meteor.Error('error-invalid_visitor', 'Visitor Not found');
		}
		const guest = visitor.name || visitor.username;
		comment = TAPi18n.__('livechat_on_hold_chat_automatically', { guest });
		onHoldChatResumedBy = Users.findOneById('rocket.cat');
	}

	return {
		comment,
		onHoldChatResumedBy,
	};
};

Meteor.methods({
	async 'livechat:resumeOnHold'(roomId, options = { clientAction: false }) {
		const room = await LivechatRooms.findOneById(roomId);
		if (!room || room.t !== 'l') {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'livechat:resumeOnHold' });
		}

		if (!room.onHold) {
			throw new Meteor.Error('room-closed', 'Room is not OnHold', { method: 'livechat:resumeOnHold' });
		}

		const { servedBy: { _id: agentId, username } } = room;

		const inquiry = LivechatInquiry.findOneByRoomId(roomId, {});
		if (!inquiry) {
			throw new Meteor.Error('inquiry-not-found', 'Error! No inquiry found for this room', { method: 'livechat:resumeOnHold' });
		}

		await RoutingManager.takeInquiry(inquiry, { agentId, username }, options);

		const { comment, onHoldChatResumedBy } = resolveOnHoldCommentInfo(options, room);
		(Messages as any).createOnHoldResumedHistoryWithRoomIdMessageAndUser(roomId, comment, onHoldChatResumedBy);

		const updatedRoom = LivechatRooms.findOneById(roomId);
		updatedRoom && Meteor.defer(() => callbacks.run('livechat:afterOnHoldChatResumed', updatedRoom));
	},
});

import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { settings } from '../../settings/client';
import { hasPermission } from '../../authorization/client';
import { MessageAction } from '../../ui-utils/client';
import { messageArgs } from '../../ui-utils/client/lib/messageArgs';
import { imperativeModal } from '../../../client/lib/imperativeModal';
import CreateDiscussion from '../../../client/components/CreateDiscussion/CreateDiscussion';
import { roomCoordinator } from '../../../client/lib/rooms/roomCoordinator';

Meteor.startup(function () {
	Tracker.autorun(() => {
		if (!settings.get('Discussion_enabled')) {
			return MessageAction.removeButton('start-discussion');
		}

		MessageAction.addButton({
			id: 'start-discussion',
			icon: 'discussion',
			label: 'Discussion_start',
			context: ['message', 'message-mobile'],
			async action() {
				const { msg: message, room } = messageArgs(this);

				imperativeModal.open({
					component: CreateDiscussion,
					props: {
						defaultParentRoom: room.prid || room._id,
						onClose: imperativeModal.close,
						parentMessageId: message._id,
						nameSuggestion: message?.msg?.substr(0, 140),
					},
				});
			},
			condition({
				msg: {
					u: { _id: uid },
					drid,
					dcount,
				},
				room,
				subscription,
				u,
			}) {
				if (drid || !isNaN(dcount)) {
					return false;
				}
				if (!subscription) {
					return false;
				}
				const isLivechatRoom = roomCoordinator.isLivechatRoom(room.t);
				if (isLivechatRoom) {
					return false;
				}

				return uid !== u._id ? hasPermission('start-discussion-other-user') : hasPermission('start-discussion');
			},
			order: 1,
			group: 'menu',
		});
	});
});

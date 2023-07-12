import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { settings } from '../../settings/client';
import { hasPermission } from '../../authorization/client';
import { messageArgs } from '../../../client/lib/utils/messageArgs';
import { imperativeModal } from '../../../client/lib/imperativeModal';
import CreateDiscussion from '../../../client/components/CreateDiscussion/CreateDiscussion';
import { roomCoordinator } from '../../../client/lib/rooms/roomCoordinator';
import { ui } from '../../../client/lib/ui';

Meteor.startup(function () {
	Tracker.autorun(() => {
		if (!settings.get('Discussion_enabled')) {
			return ui.removeMessageAction('start-discussion');
		}

		ui.addMessageAction({
			id: 'start-discussion',
			icon: 'discussion',
			label: 'Discussion_start',
			context: ['message', 'message-mobile'],
			async action(_, props) {
				const { message = messageArgs(this).msg, room } = props;

				imperativeModal.open({
					component: CreateDiscussion,
					props: {
						defaultParentRoom: room?.prid || room?._id,
						onClose: imperativeModal.close,
						parentMessageId: message._id,
						nameSuggestion: message?.msg?.substr(0, 140),
					},
				});
			},
			condition({
				message: {
					u: { _id: uid },
					drid,
					dcount,
				},
				room,
				subscription,
				user,
			}) {
				if (drid || !Number.isNaN(dcount)) {
					return false;
				}
				if (!subscription) {
					return false;
				}
				const isLivechatRoom = roomCoordinator.isLivechatRoom(room.t);
				if (isLivechatRoom) {
					return false;
				}

				if (!user) {
					return false;
				}

				return uid !== user._id ? hasPermission('start-discussion-other-user') : hasPermission('start-discussion');
			},
			order: 1,
			group: 'menu',
		});
	});
});

import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { settings } from '../../settings/client';
import { hasPermission } from '../../authorization/client';
import { MessageAction } from '../../ui-utils/client';
import { messageArgs } from '../../ui-utils/client/lib/messageArgs';
import { roomTypes } from '../../utils/client';
import { imperativeModal } from '../../../client/lib/imperativeModal';
import CreateDiscussion from '../../../client/components/CreateDiscussion/CreateDiscussion';


Meteor.startup(function() {
	Tracker.autorun(() => {
		if (!settings.get('Discussion_enabled')) {
			return MessageAction.removeButton('start-discussion');
		}

		MessageAction.addButton({
			id: 'start-discussion',
			icon: 'discussion',
			label: 'Discussion_start',
			context: ['message', 'message-mobile'],
			async action(_, props) {
				const { message = messageArgs(this).msg } = props;

				imperativeModal.open({
					component: CreateDiscussion,
					props: {
						defaultParentRoom: message.rid,
						onClose: imperativeModal.close,
						parentMessageId: message._id,
						nameSuggestion: message?.msg?.substr(0, 140),
					},
				});
			},
			condition({ message: { u: { _id: uid }, drid, dcount }, room, subscription, user }) {
				if (drid || !dcount) {
					return false;
				}
				if (!subscription) {
					return false;
				}
				const isLivechatRoom = roomTypes.isLivechatRoom(room.t);
				if (isLivechatRoom) {
					return false;
				}

				return uid !== user._id ? hasPermission('start-discussion-other-user') : hasPermission('start-discussion');
			},
			order: 1,
			group: 'menu',
		});
	});
});

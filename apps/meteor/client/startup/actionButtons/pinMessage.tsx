import { Meteor } from 'meteor/meteor';

import { hasAtLeastOnePermission } from '../../../app/authorization/client';
import { settings } from '../../../app/settings/client';
import { MessageAction } from '../../../app/ui-utils/client';
import { imperativeModal } from '../../lib/imperativeModal';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';
import { messageArgs } from '../../lib/utils/messageArgs';
import PinMessageModal from '../../views/room/modals/PinMessageModal';

Meteor.startup(() => {
	MessageAction.addButton({
		id: 'pin-message',
		icon: 'pin',
		label: 'Pin',
		type: 'interaction',
		context: ['pinned', 'message', 'message-mobile', 'threads', 'direct', 'videoconf', 'videoconf-threads'],
		async action(_, props) {
			const { message = messageArgs(this).msg } = props;

			imperativeModal.open({
				component: PinMessageModal,
				props: {
					message,
					onCancel: () => imperativeModal.close(),
				},
			});
		},
		condition({ message, subscription, room }) {
			if (!settings.get('Message_AllowPinning') || message.pinned || !subscription) {
				return false;
			}
			const isLivechatRoom = roomCoordinator.isLivechatRoom(room.t);
			if (isLivechatRoom) {
				return false;
			}
			return hasAtLeastOnePermission('pin-message', message.rid);
		},
		order: 2,
		group: 'menu',
	});
});

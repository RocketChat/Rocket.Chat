import { Meteor } from 'meteor/meteor';

import { hasAtLeastOnePermission } from '../../../app/authorization/client';
import { settings } from '../../../app/settings/client';
import { MessageAction } from '../../../app/ui-utils/client';
import { sdk } from '../../../app/utils/client/lib/SDKClient';
import GenericModal from '../../components/GenericModal/index';
import { imperativeModal } from '../../lib/imperativeModal';
import { queryClient } from '../../lib/queryClient';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';
import { dispatchToastMessage } from '../../lib/toast';
import { messageArgs } from '../../lib/utils/messageArgs';

Meteor.startup(() => {
	MessageAction.addButton({
		id: 'pin-message',
		icon: 'pin',
		label: 'Pin',
		type: 'interaction',
		context: ['pinned', 'message', 'message-mobile', 'threads', 'direct', 'videoconf', 'videoconf-threads'],
		async action(_, props) {
			const { message = messageArgs(this).msg } = props;
			const onCloseModal = () => {
				imperativeModal.close();
			};
			const onConfirm = async (): Promise<void> => {
				message.pinned = true;
				try {
					await sdk.call('pinMessage', message);
					queryClient.invalidateQueries(['rooms', message.rid, 'pinned-messages']);
				} catch (error) {
					dispatchToastMessage({ type: 'error', message: error });
				}
				onCloseModal();
			};

			imperativeModal.open({
				component: GenericModal,
				props: {
					title: 'Are you sure you want to pin this message?',
					variant: 'info',
					confirmText: 'Yes pin it',
					onConfirm,
					onClose: onCloseModal,
					onCancel: onCloseModal,
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

import { Meteor } from 'meteor/meteor';

import { hasAtLeastOnePermission } from '../../../app/authorization/client';
import { settings } from '../../../app/settings/client';
import { MessageAction } from '../../../app/ui-utils/client';
import { sdk } from '../../../app/utils/client/lib/SDKClient';
import { imperativeModal } from '../../lib/imperativeModal';
import { queryClient } from '../../lib/queryClient';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';
import { dispatchToastMessage } from '../../lib/toast';
import { messageArgs } from '../../lib/utils/messageArgs';

import PinMessageQuoteAttachment from './components/PinMessageQuoteAttachment';
import GenericModal from '../../components/GenericModal';
import React from 'react';
import { t } from '../../../app/utils/lib/i18n';

Meteor.startup(() => {
	MessageAction.addButton({
		id: 'pin-message',
		icon: 'pin',
		label: 'Pin',
		type: 'interaction',
		context: ['pinned', 'message', 'message-mobile', 'threads', 'direct', 'videoconf', 'videoconf-threads'],
		async action(_, props) {
			const { message = messageArgs(this).msg } = props;
			const onClose = () => {
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
				onClose();
			};
			imperativeModal.open({
				component: GenericModal,
				props: {
					variant: 'warning',
					children: <PinMessageQuoteAttachment message={message} />,
					icon: 'pin',
					title: t('pin-message'),
					confirmText: t('Yes_pin_message'),
					cancelText: t('Cancel'),
					onConfirm,
					onClose,
					onCancel: onClose,
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

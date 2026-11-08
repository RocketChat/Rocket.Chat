import { isE2EEMessage } from '@rocket.chat/core-typings';
import type { IRoom, IMessage } from '@rocket.chat/core-typings';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { selectedMessageStore } from '../../../../../views/room/providers/SelectedMessagesProvider';
import MessageToolbarItem from '../../MessageToolbarItem';

export type ForwardMessageActionProps = {
	message: IMessage;
	room: IRoom;
};

const ForwardMessageAction = ({ message, room }: ForwardMessageActionProps) => {
	const { t } = useTranslation();

	const encrypted = isE2EEMessage(message);
	const isABACEnabled = !!room.abacAttributes;

	const getTitle = useMemo(() => {
		if (encrypted) {
			return t('Action_not_available_encrypted_content', { action: t('Forward_message') });
		}
		if (isABACEnabled) {
			return t('Not_available_for_ABAC_enabled_rooms');
		}
		return t('Forward_message');
	}, [encrypted, isABACEnabled, t]);

	return (
		<MessageToolbarItem
			id='forward-message'
			icon='arrow-forward'
			title={getTitle}
			disabled={encrypted || isABACEnabled}
			onClick={() => {
				if (!selectedMessageStore.isSelected(message._id)) {
					selectedMessageStore.toggle(message._id);
				}
				selectedMessageStore.setIsSelecting(true);
			}}
		/>
	);
};

export default ForwardMessageAction;

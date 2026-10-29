import { isE2EEMessage } from '@rocket.chat/core-typings';
import type { IRoom, IMessage } from '@rocket.chat/core-typings';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useMessageInteractions } from '../../../contexts/MessageInteractionsContext';
import MessageToolbarItem from '../../MessageToolbarItem';

export type ForwardMessageActionProps = {
	message: IMessage;
	room: IRoom;
};

const ForwardMessageAction = ({ message, room }: ForwardMessageActionProps) => {
	const { openForward } = useMessageInteractions();
	const { t } = useTranslation();

	const encrypted = isE2EEMessage(message);
	const isABACEnabled = !!room.abacAttributes;

	const title = useMemo(() => {
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
			title={title}
			disabled={encrypted || isABACEnabled}
			onClick={() => openForward(message)}
		/>
	);
};

export default ForwardMessageAction;

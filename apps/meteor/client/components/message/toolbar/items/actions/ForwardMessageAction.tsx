import { isE2EEMessage } from '@rocket.chat/core-typings';
import type { IRoom, IMessage } from '@rocket.chat/core-typings';
import { useSetModal } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { getPermaLink } from '../../../../../lib/getPermaLink';
import ForwardMessageModal from '../../../../../views/room/modals/ForwardMessageModal';
import MessageToolbarItem from '../../MessageToolbarItem';

type ForwardMessageActionProps = {
	message: IMessage;
	room: IRoom;
};

const ForwardMessageAction = ({ message, room }: ForwardMessageActionProps) => {
	const setModal = useSetModal();
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
			qa='Forward_message'
			disabled={encrypted || isABACEnabled}
			onClick={async () => {
				const permalink = await getPermaLink(message._id);
				setModal(
					<ForwardMessageModal
						message={message}
						permalink={permalink}
						onClose={() => {
							setModal(null);
						}}
					/>,
				);
			}}
		/>
	);
};

export default ForwardMessageAction;

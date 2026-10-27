import { GenericMenu } from '@rocket.chat/ui-client';
import { CallHistoryTableRow, getCallHistoryMenuItems, usePeekMediaSessionState } from '@rocket.chat/ui-voip';
import type { CallHistoryTableRowProps, CallHistoryInternalContact } from '@rocket.chat/ui-voip';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useMediaCallInternalHistoryActions } from './useMediaCallInternalHistoryActions';

export type CallHistoryRowInternalUserProps = Omit<CallHistoryTableRowProps<CallHistoryInternalContact>, 'onClick' | 'menu'> & {
	messageId?: string;
	rid: string;
	onClickUserInfo?: (userId: string, rid: string) => void;
	onClick: (historyId: string) => void;
};

const CallHistoryRowInternalUser = ({
	_id,
	contact,
	type,
	status,
	duration,
	timestamp,
	messageId,
	rid,
	onClickUserInfo,
	onClick,
}: CallHistoryRowInternalUserProps) => {
	const { t } = useTranslation();
	const state = usePeekMediaSessionState();
	const actions = useMediaCallInternalHistoryActions({
		contact: {
			_id: contact._id,
			username: contact.username ?? '',
			name: contact.name,
			displayName: contact.name || contact.username,
		},
		messageId,
		messageRoomId: rid,
		openUserInfo: onClickUserInfo ? (userId) => onClickUserInfo(userId, rid) : undefined,
	});

	const items = getCallHistoryMenuItems(actions, t, state);

	const handleClick = useCallback(() => {
		onClick(_id);
	}, [onClick, _id]);
	return (
		<CallHistoryTableRow
			_id={_id}
			contact={contact}
			type={type}
			status={status}
			duration={duration}
			timestamp={timestamp}
			onClick={handleClick}
			menu={<GenericMenu title={t('Options')} items={items} />}
		/>
	);
};

export default CallHistoryRowInternalUser;

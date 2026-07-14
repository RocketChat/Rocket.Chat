import { GenericMenu } from '@rocket.chat/ui-client';
import type { CallHistoryExternalContact, CallHistoryTableRowProps } from '@rocket.chat/ui-voip';
import { CallHistoryTableRow, usePeekMediaSessionState } from '@rocket.chat/ui-voip';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { getItems } from './CallHistoryRowInternalUser';
import { useMediaCallExternalHistoryActions } from './useMediaCallExternalHistoryActions';

export type CallHistoryRowExternalUserProps = Omit<CallHistoryTableRowProps<CallHistoryExternalContact>, 'onClick' | 'menu'> & {
	onClick: (historyId: string) => void;
	onClickUserInfo?: (userId: string) => void;
};

const CallHistoryRowExternalUser = ({
	_id,
	contact,
	type,
	status,
	duration,
	timestamp,
	onClick,
	onClickUserInfo,
}: CallHistoryRowExternalUserProps) => {
	const { t } = useTranslation();

	const state = usePeekMediaSessionState();

	const handleClick = useCallback(() => {
		onClick(_id);
	}, [onClick, _id]);

	const actions = useMediaCallExternalHistoryActions({
		contact,
		openUserInfo: onClickUserInfo ? (userId) => onClickUserInfo(userId) : undefined,
	});

	const items = getItems(actions, t, state);

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
export default CallHistoryRowExternalUser;

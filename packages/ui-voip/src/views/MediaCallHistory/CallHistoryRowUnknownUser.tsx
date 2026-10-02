import { GenericMenu } from '@rocket.chat/ui-client';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import type { CallHistoryUnknownContact } from '../../definitions/callHistoryContacts';
import { CallHistoryTableRow } from '../MediaCallHistoryTable';
import type { CallHistoryTableRowProps } from '../MediaCallHistoryTable';

export type CallHistoryRowUnknownUserProps = Omit<CallHistoryTableRowProps<CallHistoryUnknownContact>, 'onClick' | 'menu'> & {
	onClick: (historyId: string) => void;
};

const CallHistoryRowUnknownUser = ({ _id, contact, type, status, duration, timestamp, onClick }: CallHistoryRowUnknownUserProps) => {
	const { t } = useTranslation();
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
			menu={<GenericMenu title={t('Options')} items={[]} />}
		/>
	);
};
export default CallHistoryRowUnknownUser;

import { GenericMenu } from '@rocket.chat/ui-client';
import { CallHistoryTableRow, useMediaCallContext } from '@rocket.chat/ui-voip';
import type { CallHistoryTableExternalContact, CallHistoryTableRowProps } from '@rocket.chat/ui-voip';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

type CallHistoryRowExternalUserProps = Omit<CallHistoryTableRowProps<CallHistoryTableExternalContact>, 'onClick' | 'menu'> & {
	onClick: (historyId: string) => void;
};

const CallHistoryRowExternalUser = ({ _id, contact, type, status, duration, timestamp, onClick }: CallHistoryRowExternalUserProps) => {
	const { t } = useTranslation();

	const { onToggleWidget } = useMediaCallContext();

	const handleClick = useCallback(() => {
		onClick(_id);
	}, [onClick, _id]);

	const actions = useMemo(() => {
		if (!onToggleWidget) {
			return [];
		}
		return [
			{
				id: 'voiceCall',
				icon: 'phone',
				content: t('Voice_call'),
				onClick: () => onToggleWidget({ number: contact.number }),
			} as const,
		];
	}, [contact, onToggleWidget, t]);

	return (
		<CallHistoryTableRow
			_id={_id}
			contact={contact}
			type={type}
			status={status}
			duration={duration}
			timestamp={timestamp}
			onClick={handleClick}
			menu={<GenericMenu title={t('Options')} items={actions} />}
		/>
	);
};
export default CallHistoryRowExternalUser;

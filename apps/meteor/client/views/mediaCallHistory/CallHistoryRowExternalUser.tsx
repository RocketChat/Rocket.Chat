import { GenericMenu } from '@rocket.chat/ui-client';
import type { CallHistoryTableExternalContact, CallHistoryTableRowProps } from '@rocket.chat/ui-voip';
import { CallHistoryTableRow, useMediaCallContext, isCallingBlocked } from '@rocket.chat/ui-voip';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

type CallHistoryRowExternalUserProps = Omit<CallHistoryTableRowProps<CallHistoryTableExternalContact>, 'onClick' | 'menu'> & {
	onClick: (historyId: string) => void;
};

const CallHistoryRowExternalUser = ({ _id, contact, type, status, duration, timestamp, onClick }: CallHistoryRowExternalUserProps) => {
	const { t } = useTranslation();

	const { onToggleWidget, state } = useMediaCallContext();

	const handleClick = useCallback(() => {
		onClick(_id);
	}, [onClick, _id]);

	const actions = useMemo(() => {
		if (state === 'unauthorized' || state === 'unlicensed' || !onToggleWidget) {
			return [];
		}
		return [
			{
				id: 'voiceCall',
				icon: 'phone',
				content: t('Voice_call'),
				disabled: isCallingBlocked(state),
				tooltip: isCallingBlocked(state) ? t('Call_in_progress') : undefined,
				onClick: () => onToggleWidget({ number: contact.number }),
			} as const,
		];
	}, [contact, onToggleWidget, t, state]);

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

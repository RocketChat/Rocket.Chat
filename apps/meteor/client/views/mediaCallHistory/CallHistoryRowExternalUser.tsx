import { GenericMenu } from '@rocket.chat/ui-client';
import type { CallHistoryTableExternalContact, CallHistoryTableRowProps } from '@rocket.chat/ui-voip';
import { CallHistoryTableRow, usePeekMediaSessionState, useWidgetExternalControls } from '@rocket.chat/ui-voip';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

type CallHistoryRowExternalUserProps = Omit<CallHistoryTableRowProps<CallHistoryTableExternalContact>, 'onClick' | 'menu'> & {
	onClick: (historyId: string) => void;
};

const CallHistoryRowExternalUser = ({ _id, contact, type, status, duration, timestamp, onClick }: CallHistoryRowExternalUserProps) => {
	const { t } = useTranslation();

	const state = usePeekMediaSessionState();
	const { toggleWidget } = useWidgetExternalControls();

	const handleClick = useCallback(() => {
		onClick(_id);
	}, [onClick, _id]);

	const actions = useMemo(() => {
		if (state === 'unavailable') {
			return [];
		}
		const disabled = state !== 'available';
		return [
			{
				id: 'voiceCall',
				icon: 'phone',
				content: t('Voice_call'),
				disabled,
				tooltip: disabled ? t('Call_in_progress') : undefined,
				onClick: () => toggleWidget({ number: contact.number }),
			} as const,
		];
	}, [contact, toggleWidget, t, state]);

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

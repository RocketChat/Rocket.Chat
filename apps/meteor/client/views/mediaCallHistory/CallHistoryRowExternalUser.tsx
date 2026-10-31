import { GenericMenu } from '@rocket.chat/ui-client';
import type { CallHistoryExternalContact, CallHistoryTableRowProps } from '@rocket.chat/ui-voip';
import { CallHistoryTableRow, getCallHistoryMenuItems, usePeekMediaSessionState, useWidgetExternalControls } from '@rocket.chat/ui-voip';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export type CallHistoryRowExternalUserProps = Omit<CallHistoryTableRowProps<CallHistoryExternalContact>, 'onClick' | 'menu'> & {
	onClick: (historyId: string) => void;
};

const CallHistoryRowExternalUser = ({ _id, contact, type, status, duration, timestamp, onClick }: CallHistoryRowExternalUserProps) => {
	const { t } = useTranslation();

	const state = usePeekMediaSessionState();
	const { toggleWidget } = useWidgetExternalControls();

	const handleClick = useCallback(() => {
		onClick(_id);
	}, [onClick, _id]);

	const actions = useMemo(
		() => (state === 'unavailable' ? [] : getCallHistoryMenuItems({ voiceCall: () => toggleWidget({ number: contact.number }) }, t, state)),
		[contact, toggleWidget, t, state],
	);

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

import type { CallHistoryItemState } from '@rocket.chat/core-typings';
import { Box, Icon } from '@rocket.chat/fuselage';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

import { getCallDurationText } from '../../ui-kit/getHistoryMessagePayload';

type CallHistoryTableStatusProps = {
	status: CallHistoryItemState;
	duration: number;
};

const getCallStateText = (status: CallHistoryItemState, t: TFunction) => {
	switch (status) {
		case 'ended':
			return t('Ended');
		case 'not-answered':
			return t('Not_answered');
		case 'failed':
		case 'error':
			return t('Failed');
		case 'transferred':
			return t('Transferred');
	}
};

const getIcon = (status: CallHistoryItemState) => {
	switch (status) {
		case 'ended':
			return 'phone-off';
		case 'not-answered':
			return 'phone-question-mark';
		case 'failed':
		case 'error':
			return 'phone-issue';
		case 'transferred':
			return 'arrow-forward';
	}
};

const getVariant = (status: CallHistoryItemState) => {
	switch (status) {
		case 'not-answered':
			return 'status-font-on-warning';
		case 'failed':
		case 'error':
			return 'status-font-on-danger';
		default:
			return 'secondary';
	}
};

const CallHistoryTableStatus = ({ status, duration }: CallHistoryTableStatusProps) => {
	const icon = getIcon(status);
	const variant = getVariant(status);
	const durationText = getCallDurationText(duration);
	const { t } = useTranslation();

	return (
		<Box display='flex' flexDirection='row' alignItems='center' color={variant}>
			<Icon name={icon} color={variant} size={20} mie={8} />
			{getCallStateText(status, t)}
			{durationText && <> - {durationText}</>}
		</Box>
	);
};

export default CallHistoryTableStatus;

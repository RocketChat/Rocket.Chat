import type { Keys } from '@rocket.chat/icons';
import { useTranslation } from 'react-i18next';

import { useVoipOutboundStates } from '../../../contexts/CallContext';
import { useDialModal } from '../../../hooks/useDialModal';

export const useOmnichannelCallDialPadAction = () => {
	const { t } = useTranslation();

	const { openDialModal } = useDialModal();

	const { outBoundCallsAllowed, outBoundCallsEnabledForUser } = useVoipOutboundStates();

	return {
		isDisabled: !outBoundCallsEnabledForUser,
		handleOpenDialModal: () => openDialModal(),
		icon: 'dialpad' as Keys,
		title: outBoundCallsAllowed ? t('New_Call') : t('New_Call_Premium_Only'),
	};
};

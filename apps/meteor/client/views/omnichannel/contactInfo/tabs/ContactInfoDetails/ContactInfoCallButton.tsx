import { IconButton } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { useVoipOutboundStates } from '../../../../../contexts/CallContext';
import { useDialModal } from '../../../../../hooks/useDialModal';

const ContactInfoCallButton = ({ phoneNumber }: { phoneNumber: string }) => {
	const t = useTranslation();
	const { openDialModal } = useDialModal();
	const { outBoundCallsAllowed, outBoundCallsEnabledForUser } = useVoipOutboundStates();

	return (
		<IconButton
			onClick={() => openDialModal()}
			tiny
			disabled={!outBoundCallsEnabledForUser || !phoneNumber}
			title={outBoundCallsAllowed ? t('Call_number') : t('Call_number_premium_only')}
			icon='dialpad'
		/>
	);
};

export default ContactInfoCallButton;

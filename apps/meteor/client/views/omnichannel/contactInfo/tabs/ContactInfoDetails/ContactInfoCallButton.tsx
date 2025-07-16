import { IconButton } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { useVoipOutboundStates } from '../../../../../contexts/CallContext';
import { useDialModal } from '../../../../../hooks/useDialModal';

type ContactInfoCallButtonProps = { phoneNumber: string };

const ContactInfoCallButton = ({ phoneNumber }: ContactInfoCallButtonProps) => {
	const { t } = useTranslation();
	const { openDialModal } = useDialModal();
	const { outBoundCallsAllowed, outBoundCallsEnabledForUser } = useVoipOutboundStates();

	return (
		<IconButton
			onClick={() => openDialModal({ initialValue: phoneNumber })}
			tiny
			disabled={!outBoundCallsEnabledForUser || !phoneNumber}
			title={outBoundCallsAllowed ? t('Call_number') : t('Call_number_premium_only')}
			icon='dialpad'
		/>
	);
};

export default ContactInfoCallButton;

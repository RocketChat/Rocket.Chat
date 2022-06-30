import { IconButton } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import { useVoipOutboundStates } from '../../../../contexts/CallContext';
import { useDialModal } from '../../../../hooks/useDialModal';

export const ContactTableDialpadButton = ({ phoneNumber }: { phoneNumber: string }): ReactElement => {
	const t = useTranslation();

	const { openDialModal } = useDialModal();

	const { outBoundCallsAllowed, outBoundCallsEnabledForUser } = useVoipOutboundStates();

	return (
		<IconButton
			disabled={!outBoundCallsEnabledForUser}
			title={outBoundCallsAllowed ? t('Call_number') : t('Call_number_enterprise_only')}
			tiny
			square
			icon='phone'
			className='contact-table__call-button'
			onClick={(): void => openDialModal({ initialValue: phoneNumber })}
		/>
	);
};

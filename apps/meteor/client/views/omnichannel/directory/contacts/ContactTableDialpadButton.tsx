import { IconButton } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { MouseEvent, ReactElement } from 'react';

import { useVoipOutboundStates } from '../../../../contexts/CallContext';
import { useDialModal } from '../../../../hooks/useDialModal';

export const ContactTableDialpadButton = ({ phoneNumber }: { phoneNumber: string }): ReactElement => {
	const t = useTranslation();

	const { outBoundCallsAllowed, outBoundCallsEnabledForUser } = useVoipOutboundStates();
	const { openDialModal } = useDialModal();

	const onClick = (event: MouseEvent<HTMLButtonElement>): void => {
		event.stopPropagation();
		openDialModal({ initialValue: phoneNumber });
	};

	return (
		<IconButton
			disabled={!outBoundCallsEnabledForUser || !phoneNumber}
			title={outBoundCallsAllowed ? t('Call_number') : t('Call_number_enterprise_only')}
			tiny
			square
			icon='phone'
			className='contact-table__call-button'
			onClick={onClick}
		/>
	);
};

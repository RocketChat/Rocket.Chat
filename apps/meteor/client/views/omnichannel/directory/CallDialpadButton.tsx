import { IconButton } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { MouseEvent, ReactElement } from 'react';

import { useVoipOutboundStates } from '../../../contexts/CallContext';
import { useDialModal } from '../../../hooks/useDialModal';

export const CallDialpadButton = ({ phoneNumber, className }: { phoneNumber: string; className?: string }): ReactElement => {
	const t = useTranslation();

	const { outBoundCallsAllowed, outBoundCallsEnabledForUser } = useVoipOutboundStates();
	const { openDialModal } = useDialModal();

	const onClick = (event: MouseEvent<HTMLButtonElement>): void => {
		event.stopPropagation();
		openDialModal({ initialValue: phoneNumber });
	};

	return (
		<IconButton
			title={outBoundCallsAllowed ? t('Call_number') : t('Call_number_enterprise_only')}
			className={className}
			disabled={!outBoundCallsEnabledForUser || !phoneNumber}
			tiny
			square
			icon='phone'
			onClick={onClick}
		/>
	);
};

import { css } from '@rocket.chat/css-in-js';
import { IconButton } from '@rocket.chat/fuselage';
import type { MouseEvent, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { useVoipOutboundStates } from '../../../../contexts/CallContext';
import { useDialModal } from '../../../../hooks/useDialModal';

const rcxCallDialButton = css`
	.rcx-show-call-button-on-hover:not(:hover) & {
		display: none !important;
	}
`;

export const CallDialpadButton = ({ phoneNumber }: { phoneNumber?: string }): ReactElement => {
	const { t } = useTranslation();

	const { outBoundCallsAllowed, outBoundCallsEnabledForUser } = useVoipOutboundStates();
	const { openDialModal } = useDialModal();

	const onClick = (event: MouseEvent<HTMLButtonElement>): void => {
		event.stopPropagation();
		openDialModal({ initialValue: phoneNumber });
	};

	return (
		<IconButton
			rcx-call-dial-button
			title={outBoundCallsAllowed ? t('Call_number') : t('Call_number_premium_only')}
			className={rcxCallDialButton}
			disabled={!outBoundCallsEnabledForUser || !phoneNumber}
			tiny
			icon='phone'
			onClick={onClick}
		/>
	);
};

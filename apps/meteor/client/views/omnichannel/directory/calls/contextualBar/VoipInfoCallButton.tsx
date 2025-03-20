import { Button } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { useVoipOutboundStates } from '../../../../../contexts/CallContext';
import { useDialModal } from '../../../../../hooks/useDialModal';

type VoipInfoCallButtonProps = Exclude<
	ComponentProps<typeof Button>,
	'onClick' | 'disabled' | 'display' | 'justifyContent' | 'fontSize' | 'title'
> & {
	phoneNumber: string;
};

export const VoipInfoCallButton = ({ phoneNumber, ...props }: VoipInfoCallButtonProps): ReactElement => {
	const { t } = useTranslation();

	const { openDialModal } = useDialModal();

	const { outBoundCallsAllowed, outBoundCallsEnabledForUser } = useVoipOutboundStates();

	return (
		<Button
			{...props} // this props are injected by ButtonGroup
			onClick={(): void => openDialModal({ initialValue: phoneNumber })}
			disabled={!outBoundCallsEnabledForUser || !phoneNumber}
			title={outBoundCallsAllowed ? t('Call_number') : t('Call_number_premium_only')}
			display='flex'
			justifyContent='center'
			fontSize='p2'
			icon='phone'
		>
			{t('Call')}
		</Button>
	);
};

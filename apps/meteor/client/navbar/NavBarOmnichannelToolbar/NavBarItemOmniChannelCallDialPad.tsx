import { NavBarItem } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentPropsWithoutRef } from 'react';
import React from 'react';

import { useVoipOutboundStates } from '../../contexts/CallContext';
import { useDialModal } from '../../hooks/useDialModal';

type NavBarItemOmniChannelCallDialPadProps = ComponentPropsWithoutRef<typeof NavBarItem>;

const NavBarItemOmniChannelCallDialPad = (props: NavBarItemOmniChannelCallDialPadProps) => {
	const t = useTranslation();

	const { openDialModal } = useDialModal();

	const { outBoundCallsAllowed, outBoundCallsEnabledForUser } = useVoipOutboundStates();

	return (
		<NavBarItem
			icon='dialpad'
			onClick={(): void => openDialModal()}
			disabled={!outBoundCallsEnabledForUser}
			aria-label={t('Open_Dialpad')}
			data-tooltip={outBoundCallsAllowed ? t('New_Call') : t('New_Call_Premium_Only')}
			{...props}
		/>
	);
};

export default NavBarItemOmniChannelCallDialPad;

import { NavBarItem } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useVoipOutboundStates } from '../../contexts/CallContext';
import { useDialModal } from '../../hooks/useDialModal';

type NavBarItemOmniChannelCallDialPadProps = ComponentPropsWithoutRef<typeof NavBarItem>;

const NavBarItemOmniChannelCallDialPad = (props: NavBarItemOmniChannelCallDialPadProps) => {
	const { t } = useTranslation();

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

import { NavBarItem } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useLayout } from '@rocket.chat/ui-contexts';
import { useVoipDialer, useVoipState } from '@rocket.chat/ui-voip';
import type { HTMLAttributes } from 'react';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

type NavBarItemVoipDialerProps = Omit<HTMLAttributes<HTMLElement>, 'is'> & {
	primary?: boolean;
};

const NavBarItemVoipDialer = (props: NavBarItemVoipDialerProps) => {
	const { t } = useTranslation();
	const { sidebar } = useLayout();
	const { clientError, isEnabled, isReady, isRegistered } = useVoipState();
	const { open: isDialerOpen, openDialer, closeDialer } = useVoipDialer();

	const handleToggleDialer = useEffectEvent(() => {
		sidebar.toggle();
		isDialerOpen ? closeDialer() : openDialer();
	});

	const title = useMemo(() => {
		if (!isReady && !clientError) {
			return t('Loading');
		}

		if (!isRegistered || clientError) {
			return t('Voice_calling_disabled');
		}

		return t('New_Call');
	}, [clientError, isReady, isRegistered, t]);

	return isEnabled ? (
		<NavBarItem
			{...props}
			title={title}
			icon='phone'
			onClick={handleToggleDialer}
			pressed={isDialerOpen}
			disabled={!isReady || !isRegistered}
		/>
	) : null;
};

export default NavBarItemVoipDialer;

import { NavBarItem } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentPropsWithoutRef } from 'react';
import React from 'react';

type NavBarItemOmnichannelCallToggleLoadingProps = ComponentPropsWithoutRef<typeof NavBarItem>;

const NavBarItemOmnichannelCallToggleLoading = (props: NavBarItemOmnichannelCallToggleLoadingProps) => {
	const t = useTranslation();
	return <NavBarItem icon='phone' data-tooltip={t('Loading')} aria-label={t('VoIP_Toggle')} disabled {...props} />;
};

export default NavBarItemOmnichannelCallToggleLoading;

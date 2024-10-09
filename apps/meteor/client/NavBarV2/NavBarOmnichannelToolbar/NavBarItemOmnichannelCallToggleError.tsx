import { NavBarItem } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentPropsWithoutRef } from 'react';
import React from 'react';

type NavBarItemOmnichannelCallToggleErrorProps = ComponentPropsWithoutRef<typeof NavBarItem>;

const NavBarItemOmnichannelCallToggleError = (props: NavBarItemOmnichannelCallToggleErrorProps) => {
	const t = useTranslation();
	return <NavBarItem icon='phone' danger data-tooltip={t('Error')} disabled {...props} />;
};

export default NavBarItemOmnichannelCallToggleError;

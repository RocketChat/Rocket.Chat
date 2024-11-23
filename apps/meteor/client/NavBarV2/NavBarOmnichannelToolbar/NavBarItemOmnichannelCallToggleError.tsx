import { NavBarItem } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';

type NavBarItemOmnichannelCallToggleErrorProps = ComponentPropsWithoutRef<typeof NavBarItem>;

const NavBarItemOmnichannelCallToggleError = (props: NavBarItemOmnichannelCallToggleErrorProps) => {
	const { t } = useTranslation();
	return <NavBarItem icon='phone' danger data-tooltip={t('Error')} disabled {...props} />;
};

export default NavBarItemOmnichannelCallToggleError;

import { NavBarItem } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';
import { useTranslation } from 'react-i18next';

type NavBarItemOmnichannelCallToggleLoadingProps = ComponentPropsWithoutRef<typeof NavBarItem>;

const NavBarItemOmnichannelCallToggleLoading = (props: NavBarItemOmnichannelCallToggleLoadingProps) => {
	const { t } = useTranslation();
	return <NavBarItem icon='phone' data-tooltip={t('Loading')} aria-label={t('VoIP_Toggle')} disabled {...props} />;
};

export default NavBarItemOmnichannelCallToggleLoading;

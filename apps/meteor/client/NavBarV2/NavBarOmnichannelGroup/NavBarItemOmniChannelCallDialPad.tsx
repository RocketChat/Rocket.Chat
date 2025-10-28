import { NavBarItem } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useOmnichannelCallDialPadAction } from './hooks/useOmnichannelCallDialPadAction';

type NavBarItemOmniChannelCallDialPadProps = ComponentPropsWithoutRef<typeof NavBarItem>;

const NavBarItemOmniChannelCallDialPad = (props: NavBarItemOmniChannelCallDialPadProps) => {
	const { t } = useTranslation();

	const { title, icon, handleOpenDialModal, isDisabled } = useOmnichannelCallDialPadAction();

	return (
		<NavBarItem icon={icon} onClick={handleOpenDialModal} disabled={isDisabled} aria-label={t('Open_Dialpad')} title={title} {...props} />
	);
};

export default NavBarItemOmniChannelCallDialPad;

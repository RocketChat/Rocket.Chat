import { NavBarDivider, NavBarGroup } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import NavBarItemOmniChannelCallDialPad from './NavBarItemOmniChannelCallDialPad';
import NavBarItemOmnichannelCallToggle from './NavBarItemOmnichannelCallToggle';
import NavBarItemOmnichannelContact from './NavBarItemOmnichannelContact';
import NavBarItemOmnichannelLivechatToggle from './NavBarItemOmnichannelLivechatToggle';
import NavBarItemOmnichannelQueue from './NavBarItemOmnichannelQueue';
import { useIsCallEnabled, useIsCallReady } from '../../contexts/CallContext';
import { useOmnichannelEnabled } from '../../hooks/omnichannel/useOmnichannelEnabled';

const NavBarOmnichannelGroup = () => {
	const { t } = useTranslation();
	const showOmnichannel = useOmnichannelEnabled();

	const isCallEnabled = useIsCallEnabled();
	const isCallReady = useIsCallReady();

	if (!showOmnichannel) {
		return null;
	}

	return (
		<>
			<NavBarGroup aria-label={t('Omnichannel')}>
				<NavBarItemOmnichannelQueue />
				{isCallReady && <NavBarItemOmniChannelCallDialPad />}
				<NavBarItemOmnichannelContact />
				{isCallEnabled && <NavBarItemOmnichannelCallToggle />}
				<NavBarItemOmnichannelLivechatToggle />
			</NavBarGroup>
			<NavBarDivider />
		</>
	);
};

export default NavBarOmnichannelGroup;

import { NavBarGroup } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import NavBarItemOmnichannelContact from './NavBarItemOmnichannelContact';
import NavBarItemOmnichannelLivechatToggle from './NavBarItemOmnichannelLivechatToggle';
import NavBarItemOmnichannelQueue from './NavBarItemOmnichannelQueue';

const NavBarOmnichannelGroup = () => {
	const { t } = useTranslation();

	return (
		<NavBarGroup aria-label={t('Omnichannel')}>
			<NavBarItemOmnichannelQueue />
			<NavBarItemOmnichannelContact />
			<NavBarItemOmnichannelLivechatToggle />
		</NavBarGroup>
	);
};

export default NavBarOmnichannelGroup;

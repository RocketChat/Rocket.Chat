import { NavBarDivider, NavBarGroup } from '@rocket.chat/fuselage';
import { useVoipState } from '@rocket.chat/ui-voip';
import { useTranslation } from 'react-i18next';

import NavBarItemVoipDialer from './NavBarItemVoipDialer';
import NavBarItemVoipToggler from './NavBarItemVoipToggler';
import { useIsCallEnabled } from '../../contexts/CallContext';

const NavBarVoipGroup = () => {
	const { t } = useTranslation();
	const { isEnabled: showVoip } = useVoipState();
	const isCallEnabled = useIsCallEnabled();

	if (!showVoip) {
		return null;
	}

	return (
		<>
			<NavBarGroup aria-label={t('Voice_Call')}>
				<NavBarItemVoipDialer primary={isCallEnabled} />
				<NavBarItemVoipToggler />
			</NavBarGroup>
			<NavBarDivider />
		</>
	);
};

export default NavBarVoipGroup;

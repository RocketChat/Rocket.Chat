import { NavBarSection, NavBarGroup } from '@rocket.chat/fuselage';
import { useUser, useLayout } from '@rocket.chat/ui-contexts';
import { useMediaCallAction } from '@rocket.chat/ui-voip';
import { useTranslation } from 'react-i18next';

import NavBarControlsWithData from './NavBarControlsWithData';
import { useOmnichannelEnabled } from '../../views/omnichannel/hooks/useOmnichannelEnabled';
import NavBarOmnichannelGroup from '../NavBarOmnichannelGroup';
import { NavBarItemLoginPage, NavBarItemAdministrationMenu, UserMenu } from '../NavBarSettingsToolbar';
import NavBarVoipGroup from '../NavBarVoipGroup';

const NavBarControlsSection = () => {
	const { t } = useTranslation();
	const user = useUser();
	const { isMobile } = useLayout();

	const showOmnichannel = useOmnichannelEnabled();
	const callAction = useMediaCallAction();

	if (isMobile) {
		return (
			<NavBarSection>
				{(showOmnichannel || callAction) && <NavBarControlsWithData />}
				<NavBarGroup aria-label={t('Workspace_and_user_preferences')}>
					<NavBarItemAdministrationMenu />
					{user ? <UserMenu user={user} /> : <NavBarItemLoginPage />}
				</NavBarGroup>
			</NavBarSection>
		);
	}

	return (
		<NavBarSection>
			{callAction && <NavBarVoipGroup />}
			{showOmnichannel && <NavBarOmnichannelGroup />}
			<NavBarGroup aria-label={t('Workspace_and_user_preferences')}>
				<NavBarItemAdministrationMenu />
				{user ? <UserMenu user={user} /> : <NavBarItemLoginPage />}
			</NavBarGroup>
		</NavBarSection>
	);
};

export default NavBarControlsSection;

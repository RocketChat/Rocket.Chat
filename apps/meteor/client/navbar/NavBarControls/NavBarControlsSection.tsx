import { NavBarSection, NavBarGroup } from '@rocket.chat/fuselage';
import { useUser, useLayout } from '@rocket.chat/ui-contexts';
import { useMediaCallAction } from '@rocket.chat/ui-voip';
import { useTranslation } from 'react-i18next';

import NavBarControlsWithData from './NavBarControlsWithData';
import { useConferenceWindowEnabled } from '../../views/conference/hooks/useConferenceWindowEnabled';
import { useOmnichannelEnabled } from '../../views/omnichannel/hooks/useOmnichannelEnabled';
import NavBarItemOngoingCalls from '../NavBarItemOngoingCalls';
import NavBarOmnichannelGroup from '../NavBarOmnichannelGroup';
import { NavBarItemLoginPage, NavBarItemAdministrationMenu, UserMenu } from '../NavBarSettingsToolbar';
import NavBarVoipGroup from '../NavBarVoipGroup';

const NavBarControlsSection = () => {
	const { t } = useTranslation();
	const user = useUser();
	const { isMobile } = useLayout();

	const showOmnichannel = useOmnichannelEnabled();
	const callAction = useMediaCallAction();
	// The calls-already-running list has nothing to list without the call window, and asking for one would poll
	// for joinable calls a workspace has no way to join.
	const showOngoingCalls = useConferenceWindowEnabled();

	if (isMobile) {
		return (
			<NavBarSection>
				{showOngoingCalls && <NavBarItemOngoingCalls />}
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
			{showOngoingCalls && <NavBarItemOngoingCalls />}
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

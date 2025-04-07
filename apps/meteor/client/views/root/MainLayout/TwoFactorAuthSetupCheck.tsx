import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '@rocket.chat/ui-client';
import { useLayout, useUser, useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';
import { lazy } from 'react';

import LayoutWithSidebar from './LayoutWithSidebar';
import LayoutWithSidebarV2 from './LayoutWithSidebarV2';
import { Roles } from '../../../../app/models/client';

const AccountSecurityPage = lazy(() => import('../../account/security/AccountSecurityPage'));

const TwoFactorAuthSetupCheck = ({ children }: { children: ReactNode }): ReactElement => {
	const { isEmbedded: embeddedLayout } = useLayout();
	const user = useUser();
	const tfaEnabled = useSetting('Accounts_TwoFactorAuthentication_Enabled');
	const require2faSetup = Roles.use((state) => {
		// User is already using 2fa
		if (!user || user?.services?.totp?.enabled || user?.services?.email2fa?.enabled) {
			return false;
		}

		const mandatoryRole = state.find((role) => !!role.mandatory2fa && user.roles?.includes(role._id));
		return mandatoryRole !== undefined && tfaEnabled;
	});
	if (require2faSetup) {
		return (
			<main id='rocket-chat' className={embeddedLayout ? 'embedded-view' : undefined}>
				<div className='main-content content-background-color'>
					<AccountSecurityPage />
				</div>
			</main>
		);
	}

	return (
		<FeaturePreview feature='newNavigation'>
			<FeaturePreviewOff>
				<LayoutWithSidebar>{children}</LayoutWithSidebar>
			</FeaturePreviewOff>
			<FeaturePreviewOn>
				<LayoutWithSidebarV2>{children}</LayoutWithSidebarV2>
			</FeaturePreviewOn>
		</FeaturePreview>
	);
};

export default TwoFactorAuthSetupCheck;

import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '@rocket.chat/ui-client';
import { useLayout } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';
import { lazy } from 'react';

import LayoutWithSidebar from './LayoutWithSidebar';
import LayoutWithSidebarV2 from './LayoutWithSidebarV2';
import { useRequire2faSetup } from '../../hooks/useRequire2faSetup';

const AccountSecurityPage = lazy(() => import('../../account/security/AccountSecurityPage'));

const TwoFactorAuthSetupCheck = ({ children }: { children: ReactNode }): ReactElement => {
	const { isEmbedded: embeddedLayout } = useLayout();
	const require2faSetup = useRequire2faSetup();

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

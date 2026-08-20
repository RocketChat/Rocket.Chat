import { Box } from '@rocket.chat/fuselage';
import { useLayout } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { lazy } from 'react';

import MainContent from './MainContent';
import { useRequire2faSetup } from '../../hooks/useRequire2faSetup';

const AccountSecurityPage = lazy(() => import('../../account/security/AccountSecurityPage'));

export type TwoFactorAuthSetupCheckProps = { children: ReactNode };

const TwoFactorAuthSetupCheck = ({ children }: TwoFactorAuthSetupCheckProps) => {
	const { isEmbedded: embeddedLayout } = useLayout();
	const require2faSetup = useRequire2faSetup();

	if (require2faSetup) {
		return (
			<Box backgroundColor='surface-light' id='rocket-chat' className={embeddedLayout ? 'embedded-view' : undefined}>
				<MainContent>
					<AccountSecurityPage />
				</MainContent>
			</Box>
		);
	}

	return children;
};

export default TwoFactorAuthSetupCheck;

import React from 'react';
import { Box, Accordion } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';
import { useSetting } from '../../contexts/SettingsContext';
import Page from '../../components/basic/Page';
import NotAuthorizedPage from '../../components/NotAuthorizedPage';
import TwoFactorTOTP from './TwoFactorTOTP';
import TwoFactorEmail from './TwoFactorEmail';
import EndToEnd from './EndToEnd';

const AccountSecurityPage = () => {
	const t = useTranslation();

	const twoFactorEnabled = useSetting('Accounts_TwoFactorAuthentication_Enabled');
	const twoFactorByEmailEnabled = useSetting('Accounts_TwoFactorAuthentication_By_Email_Enabled');
	const e2eEnabled = useSetting('E2E_Enable');

	if (!twoFactorEnabled && !e2eEnabled) {
		return <NotAuthorizedPage />;
	}

	return <Page>
		<Page.Header title={t('Security')} />
		<Page.ScrollableContentWithShadow>
			<Box maxWidth='x600' w='full' alignSelf='center'>
				<Accordion>
					{(twoFactorEnabled || twoFactorByEmailEnabled) && <Accordion.Item title={t('Two Factor Authentication')} defaultExpanded>
						{twoFactorEnabled && <TwoFactorTOTP />}
						{twoFactorByEmailEnabled && <TwoFactorEmail />}
					</Accordion.Item>}
					{e2eEnabled && <Accordion.Item title={t('E2E Encryption')} defaultExpanded={!twoFactorEnabled}>
						<EndToEnd />
					</Accordion.Item>}
				</Accordion>
			</Box>
		</Page.ScrollableContentWithShadow>
	</Page>;
};

export default AccountSecurityPage;

import React, { useState } from 'react';
import { Box, Accordion } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';
import { useUser } from '../../contexts/UserContext';
import { useSetting } from '../../contexts/SettingsContext';
import Page from '../../components/basic/Page';
import NotAuthorizedPage from '../../components/NotAuthorizedPage';
import TwoFactorTOTP from './TwoFactorTOTP';
import TwoFactorEmail from './TwoFactorEmail';
import EndToEnd from './EndToEnd';

const AccountSecurityPage = () => {
	const t = useTranslation();

	const [modal, setModal] = useState(null);

	const user = useUser();

	const twoFactorEnabled = useSetting('Accounts_TwoFactorAuthentication_Enabled');
	const e2eEnabled = useSetting('E2E_Enable');

	if (!twoFactorEnabled && !e2eEnabled) {
		return <NotAuthorizedPage />;
	}

	return <>
		<Page>
			<Page.Header title={t('Security')} />
			<Page.ScrollableContentWithShadow>
				<Box maxWidth='x600' w='full' alignSelf='center'>
					<Accordion>
						{twoFactorEnabled && <Accordion.Item title={t('Two Factor Authentication')} defaultExpanded>
							<TwoFactorTOTP user={user} setModal={setModal}/>
							<TwoFactorEmail user={user} />
						</Accordion.Item>}
						{e2eEnabled && <Accordion.Item title={t('E2E Encryption')} defaultExpanded={!twoFactorEnabled}>
							<EndToEnd />
						</Accordion.Item>}
					</Accordion>
				</Box>
			</Page.ScrollableContentWithShadow>
		</Page>
		{modal}
	</>;
};

export default AccountSecurityPage;

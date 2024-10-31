import type { App } from '@rocket.chat/core-typings';
import { Box, Margins } from '@rocket.chat/fuselage';
import React from 'react';
import { useTranslation } from 'react-i18next';

import AppSecurityLabel from './AppSecurityLabel';
import AppPermissionsList from '../../../components/AppPermissionsList';

type AppSecurityProps = {
	app: App;
};

const AppSecurity = ({ app }: AppSecurityProps) => {
	const { t } = useTranslation();

	return (
		<Box maxWidth='x640' w='full' marginInline='auto' color='default'>
			<Box display='flex' flexDirection='column'>
				<Margins block={16}>
					<Box is='section'>
						<AppSecurityLabel>{t('Privacy_summary')}</AppSecurityLabel>
						<Box is='p' lineHeight='x20'>
							{app.privacyPolicySummary?.length && app.privacyPolicySummary}
						</Box>
					</Box>

					<Box is='section'>
						<AppSecurityLabel>{t('Permissions')}</AppSecurityLabel>
						<Box is='ol' type='1' style={{ listStyleType: 'decimal' }} mis={24}>
							<AppPermissionsList appPermissions={app.permissions} />
						</Box>
					</Box>

					<Box is='section'>
						<AppSecurityLabel>{t('Policies')}</AppSecurityLabel>
						<Box display='flex' flexDirection='column'>
							{app.tosLink && (
								<Box is='a' href={app.tosLink} target='_blank'>
									{t('Terms_of_use')}
								</Box>
							)}
							{app.privacyLink && (
								<Box is='a' href={app.privacyLink} target='_blank'>
									{t('Privacy_policy')}
								</Box>
							)}
						</Box>
					</Box>
				</Margins>
			</Box>
		</Box>
	);
};

export default AppSecurity;

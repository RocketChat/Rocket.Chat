import type { App } from '@rocket.chat/core-typings';
import { Box, Margins } from '@rocket.chat/fuselage';
import React from 'react';
import { useTranslation } from 'react-i18next';

import AppSecurityLabel from './AppSecurityLabel';
import AppPermissionsList from '../../../components/AppPermissionsList';
import { useAppQuery } from '../../../hooks/useAppQuery';

type AppSecurityProps = {
	appId: App['id'];
};

const AppSecurity = ({ appId }: AppSecurityProps) => {
	const { isSuccess, data } = useAppQuery(appId);
	const { t } = useTranslation();

	if (!isSuccess) {
		return null;
	}

	return (
		<Box maxWidth='x640' w='full' marginInline='auto' color='default'>
			<Box display='flex' flexDirection='column'>
				<Margins block={16}>
					<Box is='section'>
						<AppSecurityLabel>{t('Privacy_summary')}</AppSecurityLabel>
						<Box is='p' lineHeight='x20'>
							{data.privacyPolicySummary?.length && data.privacyPolicySummary}
						</Box>
					</Box>

					<Box is='section'>
						<AppSecurityLabel>{t('Permissions')}</AppSecurityLabel>
						<Box is='ol' type='1' style={{ listStyleType: 'decimal' }} mis={24}>
							<AppPermissionsList appPermissions={data.permissions} />
						</Box>
					</Box>

					<Box is='section'>
						<AppSecurityLabel>{t('Policies')}</AppSecurityLabel>
						<Box display='flex' flexDirection='column'>
							{data.tosLink && (
								<Box is='a' href={data.tosLink} target='_blank'>
									{t('Terms_of_use')}
								</Box>
							)}
							{data.privacyLink && (
								<Box is='a' href={data.privacyLink} target='_blank'>
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

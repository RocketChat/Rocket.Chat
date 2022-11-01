import { AppPermission } from '@rocket.chat/core-typings';
import { Box, Margins } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC } from 'react';

import HumanizedPermissions from '../../components/HumanizedPermissionsList';

type AppSecurityProps = {
	privacyPolicySummary: string | undefined;
	appPermissions: AppPermission[] | undefined;
	tosLink: string | undefined;
	privacyLink: string | undefined;
};

const AppSecurity: FC<AppSecurityProps> = ({ privacyPolicySummary, appPermissions, tosLink, privacyLink }) => {
	const t = useTranslation();

	return (
		<Box maxWidth='x640' w='full' marginInline='auto'>
			<Box display='flex' flexDirection='column'>
				<Margins block='x17'>
					<Box is='section'>
						<Box fontScale='h4' mbe='x8'>
							{t('Privacy_summary')}
						</Box>
						<Box is='p' lineHeight='x20'>
							{privacyPolicySummary?.length && privacyPolicySummary}
						</Box>
					</Box>

					<Box is='section'>
						<Box fontScale='h4' mbe='x8'>
							{t('Permissions')}
						</Box>
						<Box is='ol' type='1' style={{ listStyleType: 'decimal' }} mis='x24'>
							<HumanizedPermissions appPermissions={appPermissions} />
						</Box>
					</Box>

					<Box is='section'>
						<Box fontScale='h4' mbe='x8'>
							{t('Policies')}
						</Box>
						<Box display='flex' flexDirection='column'>
							{tosLink && (
								<Box is='a' href={tosLink} target='_blank'>
									{t('Terms_of_use')}
								</Box>
							)}
							{privacyLink && (
								<Box is='a' href={privacyLink} target='_blank'>
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

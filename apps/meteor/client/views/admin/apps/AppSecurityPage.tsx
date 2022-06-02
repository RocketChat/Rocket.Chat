import { Permission } from '@rocket.chat/core-typings';
import { Box, Margins } from '@rocket.chat/fuselage';
import { TranslationKey, useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC } from 'react';

type AppSecurityPageProps = {
	privacyPolicySummary: string | undefined;
	appPermissions: Permission[] | undefined;
};

const AppSecurityPage: FC<AppSecurityPageProps> = ({ privacyPolicySummary, appPermissions }) => {
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
							{appPermissions?.length &&
								appPermissions.map((permission) => (
									<li key={permission.name}>{t(`Apps_Permissions_${permission.name.replace('.', '_')}` as TranslationKey)}</li>
								))}
						</Box>
					</Box>

					<Box is='section'>
						<Box fontScale='h4' mbe='x8'>
							{t('Policies')}
						</Box>
						<Box display='flex' flexDirection='column'>
							<Box is='a'>Terms of use</Box>
							<Box is='a'>Privacy policy</Box>
						</Box>
					</Box>
				</Margins>
			</Box>
		</Box>
	);
};

export default AppSecurityPage;

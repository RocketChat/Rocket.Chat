import type { AppPermission } from '@rocket.chat/core-typings';
import { Stack, Text } from '@rocket.chat/fuselage';
import { ExternalLink } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import AppSecurityLabel from './AppSecurityLabel';
import ContentColumn from '../../../../../components/ContentColumn';
import RichContent from '../../../../../components/RichContent';
import AppPermissionsList from '../../../components/AppPermissionsList';
import AppDetailsTabContent from '../../layout/AppDetailsTabContent';
import AppInfoSection from '../../layout/AppInfoSection';

export type AppSecurityProps = {
	privacyPolicySummary?: string;
	appPermissions?: AppPermission[];
	tosLink?: string;
	privacyLink?: string;
};

const AppSecurity = ({ privacyPolicySummary, appPermissions, tosLink, privacyLink }: AppSecurityProps) => {
	const { t } = useTranslation();

	return (
		<AppDetailsTabContent>
			<ContentColumn size='wide'>
				<Stack gap='x32'>
					<AppInfoSection title={<AppSecurityLabel>{t('Privacy_summary')}</AppSecurityLabel>}>
						<Text is='p' fontScale='p2'>
							{privacyPolicySummary}
						</Text>
					</AppInfoSection>

					<AppInfoSection title={<AppSecurityLabel>{t('Permissions')}</AppSecurityLabel>}>
						<RichContent>
							<ol>
								<AppPermissionsList appPermissions={appPermissions} />
							</ol>
						</RichContent>
					</AppInfoSection>

					<AppInfoSection title={<AppSecurityLabel>{t('Policies')}</AppSecurityLabel>}>
						<Stack>
							{tosLink && <ExternalLink to={tosLink}>{t('Terms_of_use')}</ExternalLink>}
							{privacyLink && <ExternalLink to={privacyLink}>{t('Privacy_policy')}</ExternalLink>}
						</Stack>
					</AppInfoSection>
				</Stack>
			</ContentColumn>
		</AppDetailsTabContent>
	);
};

export default AppSecurity;

import type { AppPermission } from '@rocket.chat/core-typings';
import { Stack, Text } from '@rocket.chat/fuselage';
import { ExternalLink } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import AppSecurityLabel from './AppSecurityLabel';
import AppPermissionsList from '../../../components/AppPermissionsList';
import PermissionsList from '../../../components/layout/PermissionsList';
import AppDetailsTabPanel from '../../layout/AppDetailsTabPanel';
import AppInfoSection from '../../layout/AppInfoSection';
import AppInfoSections from '../../layout/AppInfoSections';

export type AppSecurityProps = {
	privacyPolicySummary?: string;
	appPermissions?: AppPermission[];
	tosLink?: string;
	privacyLink?: string;
};

const AppSecurity = ({ privacyPolicySummary, appPermissions, tosLink, privacyLink }: AppSecurityProps) => {
	const { t } = useTranslation();

	return (
		<AppDetailsTabPanel>
			<AppInfoSections>
				<AppInfoSection title={<AppSecurityLabel>{t('Privacy_summary')}</AppSecurityLabel>}>
					<Text is='p' fontScale='p2'>
						{privacyPolicySummary?.length && privacyPolicySummary}
					</Text>
				</AppInfoSection>

				<AppInfoSection title={<AppSecurityLabel>{t('Permissions')}</AppSecurityLabel>}>
					<PermissionsList>
						<AppPermissionsList appPermissions={appPermissions} />
					</PermissionsList>
				</AppInfoSection>

				<AppInfoSection title={<AppSecurityLabel>{t('Policies')}</AppSecurityLabel>}>
					<Stack>
						{tosLink && <ExternalLink to={tosLink}>{t('Terms_of_use')}</ExternalLink>}
						{privacyLink && <ExternalLink to={privacyLink}>{t('Privacy_policy')}</ExternalLink>}
					</Stack>
				</AppInfoSection>
			</AppInfoSections>
		</AppDetailsTabPanel>
	);
};

export default AppSecurity;

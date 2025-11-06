import { Box, Callout, Margins } from '@rocket.chat/fuselage';
import { Trans } from 'react-i18next';

import AdminABACSettingToggle from './AdminABACSettingToggle';
import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';
import { links } from '../../../lib/links';

const AdminABACSettings = () => {
	const hasABAC = useHasLicenseModule('abac');
	return (
		<Box maxWidth='x600' w='full' alignSelf='center'>
			<Box>
				<Margins block={24}>
					<AdminABACSettingToggle hasABAC={hasABAC} />

					<Callout>
						<Trans i18nKey='ABAC_Enabled_callout'>
							User attributes are synchronized via LDAP
							<a href={links.go.abacLDAPDocs} rel='noopener noreferrer' target='_blank'>
								Learn more
							</a>
						</Trans>
					</Callout>
				</Margins>
			</Box>
		</Box>
	);
};

export default AdminABACSettings;

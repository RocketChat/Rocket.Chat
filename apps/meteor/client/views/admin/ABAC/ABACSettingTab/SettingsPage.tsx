import { Box, Callout, Margins } from '@rocket.chat/fuselage';
import { Trans } from 'react-i18next';

import AbacEnabledToggle from './AbacEnabledToggle';
import SettingField from './SettingField';
import { useHasLicenseModule } from '../../../../hooks/useHasLicenseModule';
import { links } from '../../../../lib/links';

const SettingsPage = () => {
	const { data: hasABAC = false } = useHasLicenseModule('abac');
	return (
		<Box maxWidth='x600' w='full' alignSelf='center'>
			<Box>
				<Margins block={24}>
					<AbacEnabledToggle hasABAC={hasABAC} />
					<SettingField settingId='ABAC_ShowAttributesInRooms' />
					<SettingField settingId='Abac_Cache_Decision_Time_Seconds' />

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

export default SettingsPage;

import { Accordion, AccordionItem, Box, Callout, Margins } from '@rocket.chat/fuselage';
import { useTranslation, Trans } from 'react-i18next';

import AbacEnabledToggle from './AbacEnabledToggle';
import SettingField from './SettingField';
import { useHasLicenseModule } from '../../../../hooks/useHasLicenseModule';
import { links } from '../../../../lib/links';

const SettingsPage = () => {
	const { t } = useTranslation();
	const { data: hasABAC = false } = useHasLicenseModule('abac');
	return (
		<Box maxWidth='x600' w='full' alignSelf='center' overflow='auto'>
			<Box>
				<Margins block={24}>
					<AbacEnabledToggle hasABAC={hasABAC} />
					<SettingField settingId='ABAC_ShowAttributesInRooms' />
					<SettingField settingId='Abac_Cache_Decision_Time_Seconds' />

					<Accordion>
						<AccordionItem title={t('LDAP_DataSync_ABAC')}>
							<Margins block={16}>
								<SettingField settingId='LDAP_Background_Sync_ABAC_Attributes' />
								<SettingField settingId='LDAP_Background_Sync_ABAC_Attributes_Interval' />
								<SettingField settingId='LDAP_ABAC_AttributeMap' />
							</Margins>
						</AccordionItem>
					</Accordion>

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

import { Accordion, AccordionItem, Box, Callout, Margins } from '@rocket.chat/fuselage';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useTranslation, Trans } from 'react-i18next';

import AbacEnabledToggle from './AbacEnabledToggle';
import SettingField from './SettingField';
import { useHasLicenseModule } from '../../../../hooks/useHasLicenseModule';
import { links } from '../../../../lib/links';

const SettingsPage = () => {
	const { t } = useTranslation();
	const { data: hasABAC = false } = useHasLicenseModule('abac');
	const pdpType = useSetting('ABAC_PDP_Type', 'local');

	return (
		<Box maxWidth='x600' w='full' alignSelf='center' overflow='auto'>
			<Box>
				<Margins block={24}>
					<AbacEnabledToggle hasABAC={hasABAC} />
					<SettingField settingId='ABAC_PDP_Type' />
					<SettingField settingId='ABAC_ShowAttributesInRooms' />
					<SettingField settingId='Abac_Cache_Decision_Time_Seconds' />

					<Accordion>
						<AccordionItem title={t('ABAC_Virtru_PDP_Configuration')}>
							<Margins block={16}>
								<SettingField settingId='ABAC_Virtru_Base_URL' />
								<SettingField settingId='ABAC_Virtru_Client_ID' />
								<SettingField settingId='ABAC_Virtru_Client_Secret' />
								<SettingField settingId='ABAC_Virtru_OIDC_Endpoint' />
								<SettingField settingId='ABAC_Virtru_Default_Entity_Key' />
								<SettingField settingId='ABAC_Virtru_Attribute_Namespace' />
								<SettingField settingId='ABAC_Virtru_Sync_Interval' />
								<SettingField settingId='ABAC_Virtru_Test_Connection' />
							</Margins>
						</AccordionItem>
					</Accordion>

					{pdpType === 'local' && (
						<Callout>
							<Trans i18nKey='ABAC_Enabled_callout'>
								User attributes are synchronized via LDAP
								<a href={links.go.abacLDAPDocs} rel='noopener noreferrer' target='_blank'>
									Learn more
								</a>
							</Trans>
						</Callout>
					)}
				</Margins>
			</Box>
		</Box>
	);
};

export default SettingsPage;

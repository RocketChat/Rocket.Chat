import { Accordion, AccordionItem, Box, Callout, FieldGroup } from '@rocket.chat/fuselage';
import { ExternalLink } from '@rocket.chat/ui-client';
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
		<Box maxWidth='x600' w='full' alignSelf='center' overflow='auto' mb={24}>
			<FieldGroup>
				<AbacEnabledToggle hasABAC={hasABAC} />
				<SettingField settingId='ABAC_PDP_Type' />
				<SettingField settingId='ABAC_ShowAttributesInRooms' />
				<SettingField settingId='Abac_Cache_Decision_Time_Seconds' />

				{pdpType === 'local' && (
					<Callout>
						<Trans i18nKey='ABAC_Enabled_callout'>
							User attributes are synchronized via LDAP
							<ExternalLink to={links.go.abacLDAPDocs}>Learn more</ExternalLink>
						</Trans>
					</Callout>
				)}

				<Accordion>
					<AccordionItem title={t('LDAP_DataSync_ABAC')}>
						<FieldGroup>
							<SettingField settingId='LDAP_Background_Sync_ABAC_Attributes' />
							<SettingField settingId='LDAP_Background_Sync_ABAC_Attributes_Interval' />
							<SettingField settingId='LDAP_ABAC_AttributeMap' />
						</FieldGroup>
					</AccordionItem>

					<AccordionItem title={t('ABAC_Virtru_PDP_Configuration')}>
						<SettingField settingId='ABAC_Virtru_Base_URL' />
						<SettingField settingId='ABAC_Virtru_Client_ID' />
						<SettingField settingId='ABAC_Virtru_Client_Secret' />
						<SettingField settingId='ABAC_Virtru_OIDC_Endpoint' />
						<SettingField settingId='ABAC_Virtru_Default_Entity_Key' />
						<SettingField settingId='ABAC_Virtru_Attribute_Namespace' />
						<SettingField settingId='ABAC_Virtru_Sync_Interval' />
						<SettingField settingId='ABAC_Virtru_Test_Connection' />
					</AccordionItem>
				</Accordion>
			</FieldGroup>
		</Box>
	);
};

export default SettingsPage;

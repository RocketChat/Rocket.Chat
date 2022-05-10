import { onLicense } from '../../app/license/server';
import type { ISAMLUser } from '../../../app/meteor-accounts-saml/server/definition/ISAMLUser';
import { SAMLUtils } from '../../../app/meteor-accounts-saml/server/lib/Utils';
import { settings } from '../../../app/settings/server';
import { addSettings } from '../settings/saml';
import { Users } from '../../../app/models/server';
import { ensureArray } from '../../../lib/utils/arrayUtils';

onLicense('saml-enterprise', () => {
	SAMLUtils.events.on('mapUser', ({ profile, userObject }: { profile: Record<string, any>; userObject: ISAMLUser }) => {
		const roleAttributeName = settings.get('SAML_Custom_Default_role_attribute_name') as string;
		const roleAttributeSync = settings.get('SAML_Custom_Default_role_attribute_sync');

		if (!roleAttributeSync) {
			return;
		}

		if (roleAttributeName && profile[roleAttributeName]) {
			let value = profile[roleAttributeName] || '';
			if (typeof value === 'string') {
				value = value.split(',');
			}

			userObject.roles = ensureArray<string>(value);
		}
	});

	SAMLUtils.events.on('loadConfigs', (service: string, configs: Record<string, any>): void => {
		// Include ee settings on the configs object so that they can be copied to the login service too
		Object.assign(configs, {
			customAuthnContext: settings.get(`${service}_custom_authn_context`),
			authnContextComparison: settings.get(`${service}_authn_context_comparison`),
			identifierFormat: settings.get(`${service}_identifier_format`),
			nameIDPolicyTemplate: settings.get(`${service}_NameId_template`),
			authnContextTemplate: settings.get(`${service}_AuthnContext_template`),
			authRequestTemplate: settings.get(`${service}_AuthRequest_template`),
			logoutResponseTemplate: settings.get(`${service}_LogoutResponse_template`),
			logoutRequestTemplate: settings.get(`${service}_LogoutRequest_template`),
			metadataCertificateTemplate: settings.get(`${service}_MetadataCertificate_template`),
			metadataTemplate: settings.get(`${service}_Metadata_template`),
		});
	});

	SAMLUtils.events.on('updateCustomFields', (loginResult: Record<string, any>, updatedUser: { userId: string; token: string }) => {
		const userDataCustomFieldMap = settings.get('SAML_Custom_Default_user_data_custom_fieldmap') as string;
		const customMap: Record<string, any> = JSON.parse(userDataCustomFieldMap);

		const customFieldsList: Record<string, any> = {};

		for (const spCustomFieldName in customMap) {
			if (!customMap.hasOwnProperty(spCustomFieldName)) {
				continue;
			}

			const customAttribute = customMap[spCustomFieldName];
			const value = SAMLUtils.getProfileValue(loginResult.profile, {
				fieldName: spCustomFieldName,
			});
			customFieldsList[customAttribute] = value;
		}

		Users.updateCustomFieldsById(updatedUser.userId, customFieldsList);
	});
});

// For setting creation we add the listener first because the event is emmited during startup
SAMLUtils.events.on('addSettings', (name: string): void => onLicense('saml-enterprise', () => addSettings(name)));

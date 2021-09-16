import { callbacks } from '../../../app/callbacks/server';
import { onLicense } from '../../app/license/server';
import type { ISAMLUser } from '../../../app/meteor-accounts-saml/server/definition/ISAMLUser';
import { SAMLUtils } from '../../../app/meteor-accounts-saml/server/lib/Utils';
import { settings } from '../../../app/settings/server';

onLicense('SAML-enterprise', () => {
	callbacks.add('onMapSAMLUser', ({ profile, userObject }: { profile: Record<string, any>; userObject: ISAMLUser}) => {
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

			userObject.roles = SAMLUtils.ensureArray<string>(value);
		}
	});
});

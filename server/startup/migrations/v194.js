import { Users } from '../../../app/models/server';
import { Settings } from '../../../app/models/server/raw';
import { addMigration } from '../../lib/migrations';

async function updateFieldMap() {
	const _id = 'SAML_Custom_Default_user_data_fieldmap';
	const setting = await Settings.findOne({ _id });
	if (!setting || !setting.value) {
		return;
	}

	// Check if there's any user with an 'eppn' attribute. This is a custom identifier that was hardcoded on the old version
	// If there's any user with the eppn attribute stored on mongo, we will include it on the new json so that it'll continue to be used.
	const usedEppn = Boolean(Users.findOne({ eppn: { $exists: true } }, { fields: { eppn: 1 } }));

	// if it's using the old default value, simply switch to the new default
	if (setting.value === '{"username":"username", "email":"email", "cn": "name"}') {
		// include de eppn identifier if it was used
		const value = `{"username":"username", "email":"email", "name": "cn"${usedEppn ? ', "__identifier__": "eppn"' : ''}}`;
		await Settings.update(
			{ _id },
			{
				$set: {
					value,
				},
			},
		);
		return;
	}

	let oldMap;

	try {
		oldMap = JSON.parse(setting.value);
	} catch (e) {
		// If the current value wasn't even a proper JSON, we don't need to worry about changing it.
		return;
	}

	const newMap = {};
	for (const key in oldMap) {
		if (!oldMap.hasOwnProperty(key)) {
			continue;
		}

		const value = oldMap[key];
		// A simple idpField->spField is converted to spField->idpField
		if (typeof value === 'string') {
			newMap[value] = key;
		} else if (typeof value === 'object') {
			const { field, regex } = value;

			// If it didn't have a 'field' attribute, it was ignored by SAML, but let's keep it on the JSON anyway
			if (!field) {
				newMap[`_${key}`] = {
					attribute: key,
					regex,
				};
				continue;
			}

			// { idpField: { field: spField, regex} }  becomes { spField: { attribute: idpField, regex } }
			newMap[field] = {
				attribute: key,
				regex,
			};
		}
	}

	// eppn was a hardcoded custom identifier, we need to add it to the fieldmap to ensure any existing instances won't break
	if (usedEppn) {
		newMap.__identifier__ = 'eppn';
	}

	const value = JSON.stringify(newMap);

	Settings.update(
		{ _id },
		{
			$set: {
				value,
			},
		},
	);
}

function updateIdentifierLocation() {
	Users.update({ eppn: { $exists: 1 } }, { $rename: { eppn: 'services.saml.eppn' } }, { multi: true });
}

function setOldLogoutResponseTemplate() {
	// For existing users, use a template compatible with the old SAML implementation instead of the default
	return Settings.update(
		{
			_id: 'SAML_Custom_Default_LogoutResponse_template',
		},
		{
			$set: {
				value: `<samlp:LogoutResponse xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" ID="__newId__" Version="2.0" IssueInstant="__instant__" Destination="__idpSLORedirectURL__">
  <saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">__issuer__</saml:Issuer>
  <samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/>
</samlp:LogoutResponse>`,
			},
		},
		{
			upsert: true,
		},
	);
}

addMigration({
	version: 194,
	async up() {
		await updateFieldMap();
		await updateIdentifierLocation();
		await setOldLogoutResponseTemplate();
	},
});

import {
	Settings,
} from '../../../app/models/server';
import { Migrations } from '../../../app/migrations/server';

Migrations.add({
	version: 195,
	up() {
		// For existing users, use a template compatible with the old SAML implementation instead of the default
		Settings.upsert({
			_id: 'SAML_Custom_Default_LogoutResponse_template',
		}, {
			$set: {
				value: `<samlp:LogoutResponse xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" ID="__newId__" Version="2.0" IssueInstant="__instant__" Destination="__idpSLORedirectURL__">
  <saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">__issuer__</saml:Issuer>
  <samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/>
</samlp:LogoutResponse>`,
			},
		});
	},
});

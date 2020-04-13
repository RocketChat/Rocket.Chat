import { Migrations } from '../../../app/migrations';
import { Settings } from '../../../app/models/server';

Migrations.add({
	version: 183,
	up() {
		// Set SAML signature validation type to 'Response'
		Settings.upsert({
			_id: 'SAML_Custom_Default_signature_validation_type',
		}, {
			$set: {
				value: 'Response',
			},
		});
	},
});

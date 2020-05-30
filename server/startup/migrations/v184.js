import { Migrations } from '../../migrations';
import { Settings } from '../../../app/models/server';

Migrations.add({
	version: 184,
	up() {
		// Set SAML signature validation type to 'Either'
		Settings.upsert({
			_id: 'SAML_Custom_Default_signature_validation_type',
		}, {
			$set: {
				value: 'Either',
			},
		});
	},
});

import { Settings } from '../../../app/models/server/raw';
import { addMigration } from '../../lib/migrations';

addMigration({
	version: 184,
	up() {
		// Set SAML signature validation type to 'Either'
		Settings.update(
			{
				_id: 'SAML_Custom_Default_signature_validation_type',
			},
			{
				$set: {
					value: 'Either',
				},
			},
			{
				upsert: true,
			},
		);
	},
});

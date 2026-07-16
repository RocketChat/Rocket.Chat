import { Settings } from '@rocket.chat/models';

import { SystemLogger } from '../../lib/logger/system';
import { addMigration } from '../../lib/migrations';
import { settings } from '../../settings';

addMigration({
	version: 296,
	name: 'Reset the default value of Login Terms setting and replace by empty string',
	async up() {
		const oldLoginTermsValue =
			'By proceeding you are agreeing to our <a href="terms-of-service">Terms of Service</a>, <a href="privacy-policy">Privacy Policy</a> and <a href="legal-notice">Legal Notice</a>.';

		const loginTermsValue = settings.get('Layout_Login_Terms');

		if (loginTermsValue === oldLoginTermsValue) {
			// TODO: audit
			await Settings.updateOne({ _id: 'Layout_Login_Terms' }, { $set: { value: '', packageValue: '' } });
			SystemLogger.warn(`The default value of the setting 'Login Terms' has changed to an empty string. Please review your settings.`);
		}
	},
});

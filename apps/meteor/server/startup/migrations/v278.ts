import { Banners, Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';
import { isEnterprise } from '../../../ee/app/license/server';
import { settings } from '../../../app/settings/server';

addMigration({
	version: 278,
	async up() {
		const query = {
			_id: { $in: [/^Accounts_OAuth_Custom-?([^-_]+)$/] },
			value: true,
		};

		const isCustomOAuthEnabled = !!(await Settings.findOne(query));
		const LDAPEnabled = settings.get('LDAP_Enable');
		const SAMLEnabled = settings.get('SAML_Custom_Default');

		const isEE = isEnterprise();

		if (!isEE && (isCustomOAuthEnabled || LDAPEnabled || SAMLEnabled)) {
			return;
		}

		await Banners.updateOne(
			{
				'view.blocks.0.text.text': /authentication\-changes/,
				'active': { $ne: false },
			},
			{
				$set: {
					active: false,
					inactivedAt: new Date(),
				},
			},
		);
	},
});

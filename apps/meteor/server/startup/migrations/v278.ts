import { BannerPlatform } from '@rocket.chat/core-typings';
import { Users, Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';
import { isEnterprise } from '../../../ee/app/license/server';
import { Banner } from '../../sdk';
import { settings } from '../../../app/settings/server';

addMigration({
	version: 278,
	up() {
		const query = {
			_id: { $in: [/^Accounts_OAuth_Custom-?([^-_]+)$/] },
			value: true,
		};

		const isCustomOAuthEnabled = !!Promise.await(Settings.findOne(query));
		const LDAPEnabled = settings.get('LDAP_Enable');
		const SAMLEnabled = settings.get('SAML_Custom_Default');

		const isEE = isEnterprise();

		if (!isEE && (isCustomOAuthEnabled || LDAPEnabled || SAMLEnabled)) {
			return;
		}

		const users = Promise.await(Users.find().toArray());

		const banners = users.map((a) => Promise.await(Banner.getBannersForUser(a._id, BannerPlatform.Web))).flat();
		const oldMsg =
			'Please notice that after the next release (4.0) advanced functionalities of LDAP, SAML, and Custom Oauth will be available only in Enterprise Edition and Gold plan. Check the official announcement for more info: https://go.rocket.chat/i/authentication-changes';
		const newMsg =
			'Please note that after release 4.0 certain advanced authentication services features are available only in Enterprise Edition and Gold plan. Check the official announcement for more details: https://go.rocket.chat/i/authentication-changes';
		// @ts-ignore
		const authBanner = banners.find((b) => b.view.blocks[0].text.text === oldMsg || b.view.blocks[0].text.text === newMsg);

		if (!authBanner) {
			return;
		}

		Banner.disable(authBanner._id);

		users.map((a) => Banner.dismiss(a._id, authBanner._id));
	},
});

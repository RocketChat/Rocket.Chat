import { BannerPlatform } from '@rocket.chat/core-typings';
import type { IUser } from '@rocket.chat/core-typings';

import { addMigration } from '../../lib/migrations';
import { isEnterprise } from '../../../ee/app/license/server';
import { Users, Settings } from '../../../app/models/server/raw';
import { Banner } from '../../sdk';
import { settings } from '../../../app/settings/server';

addMigration({
	version: 232,
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

		const admins = Promise.await(Users.find<IUser>({ roles: 'admin' }, {}).toArray());

		const banners = admins.map((a) => Promise.await(Banner.getBannersForUser(a._id, BannerPlatform.Web))).flat();
		const msg =
			'Please notice that after the next release (4.0) advanced functionalities of LDAP, SAML, and Custom Oauth will be available only in Enterprise Edition and Gold plan. Check the official announcement for more info: https://go.rocket.chat/i/authentication-changes';
		// @ts-ignore
		const authBanner = banners.find((b) => b.view.blocks[0].text.text === msg);

		if (!authBanner) {
			return;
		}

		admins.map((a) => Banner.dismiss(a._id, authBanner._id));
	},
});

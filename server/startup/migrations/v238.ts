import { Mongo } from 'meteor/mongo';

import { Migrations } from '../../../app/migrations/server';
import { isEnterprise } from '../../../ee/app/license/server';
import { Settings } from '../../../app/models/server/raw';
// import { Banner } from '../../sdk';
// import { BannerPlatform } from '../../../definition/IBanner';
// import { IUser } from '../../../definition/IUser';
import { settings } from '../../../app/settings/server';

Migrations.add({
	version: 238,
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

		const msg = 'Please notice that after the next release (4.0) advanced functionalities of LDAP, SAML, and Custom Oauth will be available only in Enterprise Edition and Gold plan. Check the official announcement for more info: https://go.rocket.chat/i/authentication-changes';
		const newMsg = 'Please note that after release 4.0 certain advanced authentication services features are available only in Enterprise Edition and Gold plan. Check the official announcement for more details: https://go.rocket.chat/i/authentication-changes';
		const Banners = new Mongo.Collection('rocketchat_banner');
		Banners.update({ 'view.blocks': { text: { text: msg } } }, { $set: { 'view.blocks': { text: { text: newMsg } } } }, { multi: true });
	},
});

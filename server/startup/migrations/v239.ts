import { Mongo } from 'meteor/mongo';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 239,
	up() {
		const msg =
			'Please notice that after the next release (4.0) advanced functionalities of LDAP, SAML, and Custom Oauth will be available only in Enterprise Edition and Gold plan. Check the official announcement for more info: https://go.rocket.chat/i/authentication-changes';
		const newMsg =
			'Please note that after release 4.0 certain advanced authentication services features are available only in Enterprise Edition and Gold plan. Check the official announcement for more details: https://go.rocket.chat/i/authentication-changes';
		const Banners = new Mongo.Collection('rocketchat_banner');
		Banners.update({ 'view.blocks': { text: { text: msg } } }, { $set: { 'view.blocks': { text: { text: newMsg } } } }, { multi: true });
	},
});

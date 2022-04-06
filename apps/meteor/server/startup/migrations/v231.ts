import { ISectionBlock, BlockType } from '@rocket.chat/apps-engine/definition/uikit/blocks/Blocks';
import { TextObjectType } from '@rocket.chat/apps-engine/definition/uikit/blocks/Objects';
import { BannerPlatform } from '@rocket.chat/core-typings';

import { addMigration } from '../../lib/migrations';
import { Banner } from '../../sdk';
import { settings } from '../../../app/settings/server';
import { isEnterprise } from '../../../ee/app/license/server';
import { Settings } from '../../../app/models/server/raw';

addMigration({
	version: 231,
	async up() {
		const LDAPEnabled = settings.get('LDAP_Enable');
		const SAMLEnabled = settings.get('SAML_Custom_Default');

		const query = {
			_id: { $in: [/^Accounts_OAuth_(Custom-)?([^-_]+)$/, 'Accounts_OAuth_GitHub_Enterprise'] },
			value: true,
		};
		const CustomOauthEnabled = !!(await Settings.findOne(query));

		const isAuthServiceEnabled = LDAPEnabled || SAMLEnabled || CustomOauthEnabled;

		const isEE = isEnterprise();
		if (!isAuthServiceEnabled || isEE) {
			return;
		}

		const s: ISectionBlock = {
			type: BlockType.SECTION,
			blockId: 'attention',
			text: {
				type: TextObjectType.PLAINTEXT,
				text: 'Please notice that after the next release (4.0) advanced functionalities of LDAP, SAML, and Custom Oauth will be available only in Enterprise Edition and Gold plan. Check the official announcement for more info: https://go.rocket.chat/i/authentication-changes',
				emoji: false,
			},
		};

		const LDAPBanner = {
			platform: [BannerPlatform.Web],
			createdAt: new Date(),
			expireAt: new Date('2022-09-27'),
			startAt: new Date(),
			roles: ['admin'],
			createdBy: {
				_id: 'rocket.cat',
				username: 'rocket.cat',
			},
			_updatedAt: new Date(),
			view: {
				viewId: '',
				appId: '',
				blocks: [s],
			},
		};

		Promise.await(Banner.create(LDAPBanner));
	},
});

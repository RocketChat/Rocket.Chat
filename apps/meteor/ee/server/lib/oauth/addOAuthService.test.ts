import { before, beforeEach, describe, it, mock } from 'node:test';

import { expect } from 'chai';
import sinon from 'sinon';

const add = sinon.stub();

let addOAuthService: any;

before(async () => {
	mock.module('../../../../server/settings', { exports: { settingsRegistry: { add } } });
	({ addOAuthService } = await import('./addOAuthService'));
});

const defaultValues = [
	['Accounts_OAuth_Custom-Myprovider', false],
	['Accounts_OAuth_Custom-Myprovider-url', ''],
	['Accounts_OAuth_Custom-Myprovider-token_path', '/oauth/token'],
	['Accounts_OAuth_Custom-Myprovider-token_sent_via', 'payload'],
	['Accounts_OAuth_Custom-Myprovider-identity_token_sent_via', 'default'],
	['Accounts_OAuth_Custom-Myprovider-identity_path', '/me'],
	['Accounts_OAuth_Custom-Myprovider-authorize_path', '/oauth/authorize'],
	['Accounts_OAuth_Custom-Myprovider-scope', 'openid'],
	['Accounts_OAuth_Custom-Myprovider-access_token_param', 'access_token'],
	['Accounts_OAuth_Custom-Myprovider-id', ''],
	['Accounts_OAuth_Custom-Myprovider-secret', ''],
	['Accounts_OAuth_Custom-Myprovider-login_style', 'popup'],
	['Accounts_OAuth_Custom-Myprovider-button_label_text', ''],
	['Accounts_OAuth_Custom-Myprovider-button_label_color', '#FFFFFF'],
	['Accounts_OAuth_Custom-Myprovider-button_color', '#1d74f5'],
	['Accounts_OAuth_Custom-Myprovider-key_field', 'username'],
	['Accounts_OAuth_Custom-Myprovider-username_field', ''],
	['Accounts_OAuth_Custom-Myprovider-email_field', ''],
	['Accounts_OAuth_Custom-Myprovider-name_field', ''],
	['Accounts_OAuth_Custom-Myprovider-avatar_field', ''],
	['Accounts_OAuth_Custom-Myprovider-roles_claim', 'roles'],
	['Accounts_OAuth_Custom-Myprovider-groups_claim', 'groups'],
	['Accounts_OAuth_Custom-Myprovider-channels_admin', 'rocket.cat'],
	['Accounts_OAuth_Custom-Myprovider-map_channels', false],
	['Accounts_OAuth_Custom-Myprovider-merge_roles', false],
	['Accounts_OAuth_Custom-Myprovider-roles_to_sync', ''],
	['Accounts_OAuth_Custom-Myprovider-merge_users', false],
	['Accounts_OAuth_Custom-Myprovider-merge_users_distinct_services', false],
	['Accounts_OAuth_Custom-Myprovider-show_button', true],
	['Accounts_OAuth_Custom-Myprovider-groups_channel_map', '{\n\t"rocket-admin": "admin",\n\t"tech-support": "support"\n}'],
];

const providedValues = {
	enabled: true,
	serverURL: 'https://idp.example.com',
	tokenPath: '/token',
	tokenSentVia: 'header',
	identityTokenSentVia: 'payload',
	identityPath: '/userinfo',
	authorizePath: '/authorize',
	scope: 'openid email',
	accessTokenParam: 'token',
	clientId: 'client-id',
	clientSecret: 'client-secret',
	loginStyle: 'redirect',
	buttonLabelText: 'Sign in',
	buttonLabelColor: '#000000',
	buttonColor: '#ff0000',
	keyField: 'email',
	usernameField: 'preferred_username',
	emailField: 'mail',
	nameField: 'display_name',
	avatarField: 'picture',
	rolesClaim: 'app_roles',
	groupsClaim: 'app_groups',
	channelsAdmin: 'admin',
	mapChannels: true,
	mergeRoles: true,
	rolesToSync: 'admin,user',
	mergeUsers: true,
	mergeUsersDistinctServices: true,
	showButton: true,
	channelsMap: '{"group": "channel"}',
};

describe('addOAuthService', () => {
	beforeEach(() => {
		add.reset();
		add.resolves();
	});

	it('registers every setting in order with its default value when no values are given', async () => {
		await addOAuthService('MyProvider');

		expect(add.args.map(([id, value]) => [id, value])).to.deep.equal(defaultValues);
	});

	it('registers every setting in order with the given values', async () => {
		await addOAuthService('MyProvider', providedValues);

		expect(add.args.map(([id, value]) => [id, value])).to.deep.equal([
			['Accounts_OAuth_Custom-Myprovider', true],
			['Accounts_OAuth_Custom-Myprovider-url', 'https://idp.example.com'],
			['Accounts_OAuth_Custom-Myprovider-token_path', '/token'],
			['Accounts_OAuth_Custom-Myprovider-token_sent_via', 'header'],
			['Accounts_OAuth_Custom-Myprovider-identity_token_sent_via', 'payload'],
			['Accounts_OAuth_Custom-Myprovider-identity_path', '/userinfo'],
			['Accounts_OAuth_Custom-Myprovider-authorize_path', '/authorize'],
			['Accounts_OAuth_Custom-Myprovider-scope', 'openid email'],
			['Accounts_OAuth_Custom-Myprovider-access_token_param', 'token'],
			['Accounts_OAuth_Custom-Myprovider-id', 'client-id'],
			['Accounts_OAuth_Custom-Myprovider-secret', 'client-secret'],
			['Accounts_OAuth_Custom-Myprovider-login_style', 'redirect'],
			['Accounts_OAuth_Custom-Myprovider-button_label_text', 'Sign in'],
			['Accounts_OAuth_Custom-Myprovider-button_label_color', '#000000'],
			['Accounts_OAuth_Custom-Myprovider-button_color', '#ff0000'],
			['Accounts_OAuth_Custom-Myprovider-key_field', 'email'],
			['Accounts_OAuth_Custom-Myprovider-username_field', 'preferred_username'],
			['Accounts_OAuth_Custom-Myprovider-email_field', 'mail'],
			['Accounts_OAuth_Custom-Myprovider-name_field', 'display_name'],
			['Accounts_OAuth_Custom-Myprovider-avatar_field', 'picture'],
			['Accounts_OAuth_Custom-Myprovider-roles_claim', 'app_roles'],
			['Accounts_OAuth_Custom-Myprovider-groups_claim', 'app_groups'],
			['Accounts_OAuth_Custom-Myprovider-channels_admin', 'admin'],
			['Accounts_OAuth_Custom-Myprovider-map_channels', true],
			['Accounts_OAuth_Custom-Myprovider-merge_roles', true],
			['Accounts_OAuth_Custom-Myprovider-roles_to_sync', 'admin,user'],
			['Accounts_OAuth_Custom-Myprovider-merge_users', true],
			['Accounts_OAuth_Custom-Myprovider-merge_users_distinct_services', true],
			['Accounts_OAuth_Custom-Myprovider-show_button', true],
			['Accounts_OAuth_Custom-Myprovider-groups_channel_map', '{"group": "channel"}'],
		]);
	});

	it('registers show_button as true even when showButton is false', async () => {
		await addOAuthService('MyProvider', { showButton: false });

		expect(add.calledWith('Accounts_OAuth_Custom-Myprovider-show_button', true)).to.equal(true);
	});

	it('strips invalid characters, lowercases and capitalizes the name in ids and section', async () => {
		await addOAuthService('My-Pro vider_2!');

		expect(add.firstCall.args[0]).to.equal('Accounts_OAuth_Custom-Myprovider_2');
		expect(add.lastCall.args[0]).to.equal('Accounts_OAuth_Custom-Myprovider_2-groups_channel_map');
		expect(add.args.every(([, , options]) => options.section === 'Custom OAuth: Myprovider_2' && options.group === 'OAuth')).to.equal(true);
	});

	it('waits for each setting to be registered before registering the next one', async () => {
		let resolveFirst: () => void = () => undefined;
		add.onFirstCall().returns(
			new Promise<void>((resolve) => {
				resolveFirst = resolve;
			}),
		);

		const promise = addOAuthService('MyProvider');
		await Promise.resolve();

		expect(add.callCount).to.equal(1);

		resolveFirst();
		await promise;

		expect(add.callCount).to.equal(30);
	});

	it('rejects and stops registering when a setting fails to register', async () => {
		add.onCall(20).rejects(new Error('registry failure'));

		await expect(addOAuthService('MyProvider')).to.be.rejectedWith('registry failure');
		expect(add.callCount).to.equal(21);
		expect(add.lastCall.args[0]).to.equal('Accounts_OAuth_Custom-Myprovider-roles_claim');
	});

	it('registers the options of the service settings', async () => {
		await addOAuthService('MyProvider');

		const section = 'Custom OAuth: Myprovider';
		expect(add.args.slice(0, 16).map(([, , options]) => options)).to.deep.equal([
			{
				type: 'boolean',
				group: 'OAuth',
				section,
				i18nLabel: 'Accounts_OAuth_Custom_Enable',
				persistent: true,
				enterprise: true,
				modules: ['oauth-enterprise'],
				invalidValue: false,
			},
			{ type: 'string', group: 'OAuth', section, i18nLabel: 'URL', persistent: true },
			{ type: 'string', group: 'OAuth', section, i18nLabel: 'Accounts_OAuth_Custom_Token_Path', persistent: true },
			{
				type: 'select',
				group: 'OAuth',
				section,
				i18nLabel: 'Accounts_OAuth_Custom_Token_Sent_Via',
				persistent: true,
				values: [
					{ key: 'header', i18nLabel: 'Header' },
					{ key: 'payload', i18nLabel: 'Payload' },
				],
			},
			{
				type: 'select',
				group: 'OAuth',
				section,
				i18nLabel: 'Accounts_OAuth_Custom_Identity_Token_Sent_Via',
				persistent: true,
				values: [
					{ key: 'default', i18nLabel: 'Same_As_Token_Sent_Via' },
					{ key: 'header', i18nLabel: 'Header' },
					{ key: 'payload', i18nLabel: 'Payload' },
				],
			},
			{ type: 'string', group: 'OAuth', section, i18nLabel: 'Accounts_OAuth_Custom_Identity_Path', persistent: true },
			{ type: 'string', group: 'OAuth', section, i18nLabel: 'Accounts_OAuth_Custom_Authorize_Path', persistent: true },
			{ type: 'string', group: 'OAuth', section, i18nLabel: 'Accounts_OAuth_Custom_Scope', persistent: true },
			{ type: 'string', group: 'OAuth', section, i18nLabel: 'Accounts_OAuth_Custom_Access_Token_Param', persistent: true },
			{ type: 'string', group: 'OAuth', section, i18nLabel: 'Accounts_OAuth_Custom_id', persistent: true },
			{ type: 'string', group: 'OAuth', section, i18nLabel: 'Accounts_OAuth_Custom_Secret', persistent: true },
			{
				type: 'select',
				group: 'OAuth',
				section,
				i18nLabel: 'Accounts_OAuth_Custom_Login_Style',
				persistent: true,
				values: [
					{ key: 'redirect', i18nLabel: 'Redirect' },
					{ key: 'popup', i18nLabel: 'Popup' },
					{ key: '', i18nLabel: 'Default' },
				],
			},
			{ type: 'string', group: 'OAuth', section, i18nLabel: 'Accounts_OAuth_Custom_Button_Label_Text', persistent: true },
			{
				type: 'string',
				group: 'OAuth',
				section,
				i18nLabel: 'Accounts_OAuth_Custom_Button_Label_Color',
				persistent: true,
				alert: 'OAuth_button_colors_alert',
			},
			{
				type: 'string',
				group: 'OAuth',
				section,
				i18nLabel: 'Accounts_OAuth_Custom_Button_Color',
				persistent: true,
				alert: 'OAuth_button_colors_alert',
			},
			{
				type: 'select',
				group: 'OAuth',
				section,
				i18nLabel: 'Accounts_OAuth_Custom_Key_Field',
				persistent: true,
				values: [
					{ key: 'username', i18nLabel: 'Username' },
					{ key: 'email', i18nLabel: 'Email' },
				],
			},
		]);
	});

	it('registers the options of the user mapping and sync settings', async () => {
		await addOAuthService('MyProvider');

		const section = 'Custom OAuth: Myprovider';
		expect(add.args.slice(16).map(([, , options]) => options)).to.deep.equal([
			{ type: 'string', group: 'OAuth', section, i18nLabel: 'Accounts_OAuth_Custom_Username_Field', persistent: true },
			{ type: 'string', group: 'OAuth', section, i18nLabel: 'Accounts_OAuth_Custom_Email_Field', persistent: true },
			{ type: 'string', group: 'OAuth', section, i18nLabel: 'Accounts_OAuth_Custom_Name_Field', persistent: true },
			{ type: 'string', group: 'OAuth', section, i18nLabel: 'Accounts_OAuth_Custom_Avatar_Field', persistent: true },
			{
				type: 'string',
				group: 'OAuth',
				section,
				i18nLabel: 'Accounts_OAuth_Custom_Roles_Claim',
				enterprise: true,
				invalidValue: 'roles',
				modules: ['oauth-enterprise'],
			},
			{
				type: 'string',
				group: 'OAuth',
				section,
				i18nLabel: 'Accounts_OAuth_Custom_Groups_Claim',
				enterprise: true,
				invalidValue: 'groups',
				modules: ['oauth-enterprise'],
			},
			{ type: 'string', group: 'OAuth', section, i18nLabel: 'Accounts_OAuth_Custom_Channel_Admin', persistent: true },
			{
				type: 'boolean',
				group: 'OAuth',
				section,
				i18nLabel: 'Accounts_OAuth_Custom_Map_Channels',
				enterprise: true,
				invalidValue: false,
				modules: ['oauth-enterprise'],
			},
			{
				type: 'boolean',
				group: 'OAuth',
				section,
				i18nLabel: 'Accounts_OAuth_Custom_Merge_Roles',
				enterprise: true,
				invalidValue: false,
				modules: ['oauth-enterprise'],
			},
			{
				type: 'string',
				group: 'OAuth',
				section,
				i18nLabel: 'Accounts_OAuth_Custom_Roles_To_Sync',
				i18nDescription: 'Accounts_OAuth_Custom_Roles_To_Sync_Description',
				enterprise: true,
				enableQuery: { _id: 'Accounts_OAuth_Custom-Myprovider-merge_roles', value: true },
				invalidValue: '',
				modules: ['oauth-enterprise'],
			},
			{ type: 'boolean', group: 'OAuth', section, i18nLabel: 'Accounts_OAuth_Custom_Merge_Users', persistent: true },
			{
				type: 'boolean',
				group: 'OAuth',
				section,
				i18nLabel: 'Accounts_OAuth_Custom_Merge_Users_Distinct_Services',
				i18nDescription: 'Accounts_OAuth_Custom_Merge_Users_Distinct_Services_Description',
				enableQuery: { _id: 'Accounts_OAuth_Custom-Myprovider-merge_users', value: true },
				persistent: true,
			},
			{ type: 'boolean', group: 'OAuth', section, i18nLabel: 'Accounts_OAuth_Custom_Show_Button_On_Login_Page', persistent: true },
			{
				type: 'code',
				multiline: true,
				code: 'application/json',
				group: 'OAuth',
				section,
				i18nLabel: 'Accounts_OAuth_Custom_Channel_Map',
				persistent: true,
			},
		]);
	});
});

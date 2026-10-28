import { ClientSafeError } from '@rocket.chat/core-services';
import type { IUser, OAuthConfiguration } from '@rocket.chat/core-typings';
import type { IUsersModel } from '@rocket.chat/model-typings';
import type { Accounts } from 'meteor/accounts-base';
import type { OAuth2 } from 'oauth';

import type { CustomOAuthStrategy } from './customOAuth';

type Config = OAuthConfiguration & { clientSecret: string };

const makeConfig = (overrides: Partial<Config> = {}): Config => ({
	custom: true,
	clientId: 'client-id',
	clientSecret: 'client-secret',
	secret: 'encrypted-secret',
	serverURL: 'https://identity.example.com',
	authorizePath: '/authorize',
	tokenPath: '/token',
	identityPath: '/profile',
	scope: 'openid email',
	tokenSentVia: 'payload',
	identityTokenSentVia: 'default',
	accessTokenParam: '',
	keyField: 'username',
	usernameField: '',
	emailField: '',
	nameField: '',
	avatarField: '',
	rolesClaim: '',
	groupsClaim: '',
	channelsMap: '',
	channelsAdmin: '',
	mergeUsers: false,
	mergeUsersDistinctServices: false,
	mapChannels: false,
	mergeRoles: false,
	rolesToSync: '',
	showButton: true,
	buttonLabelText: '',
	buttonLabelColor: '',
	buttonColor: '',
	loginStyle: '',
	...overrides,
});

const makeUser = (overrides: Partial<IUser> = {}): IUser => ({
	_id: 'local-user',
	_updatedAt: new Date('2026-01-01'),
	createdAt: new Date('2026-01-01'),
	roles: ['user'],
	type: 'user',
	active: true,
	username: 'alice',
	name: 'Alice',
	...overrides,
});

function setup() {
	const originalAccountOperation = jest.fn();
	const accounts = {
		addAutopublishFields: jest.fn(),
		validateNewUser: jest.fn<void, [(user: IUser & { email?: string }) => boolean]>(),
		updateOrCreateUserFromExternalService: originalAccountOperation as typeof Accounts.updateOrCreateUserFromExternalService,
	};
	const users = {
		findOneByUsernameIgnoringCase: jest.fn(),
		findOneByUsernameAndServiceNameIgnoringCase: jest.fn(),
		findOneByEmailAddress: jest.fn(),
		findOneByEmailAddressAndServiceNameIgnoringCase: jest.fn(),
		findOneById: jest.fn(),
		getUpdater: jest.fn(),
		updateFromUpdater: jest.fn().mockResolvedValue(undefined),
	};
	const updater = { set: jest.fn() };
	users.getUpdater.mockReturnValue(updater);
	const session = {
		startTransaction: jest.fn(),
		commitTransaction: jest.fn().mockResolvedValue(undefined),
		abortTransaction: jest.fn().mockResolvedValue(undefined),
		endSession: jest.fn().mockResolvedValue(undefined),
	};
	const startSession = jest.fn().mockReturnValue(session);
	const settingValues = new Map<string, unknown>([['Site_Url', 'https://chat.example.com/']]);
	const settings = { get: jest.fn((key: string) => settingValues.get(key)) };
	const runCallback = jest.fn().mockResolvedValue(undefined);
	const notify = jest.fn();
	const saveIdentity = jest.fn().mockResolvedValue(true);
	const ldapLogin = jest.fn().mockResolvedValue(undefined);
	const hasModule = jest.fn().mockReturnValue(false);
	let Strategy!: typeof CustomOAuthStrategy;
	let oauth!: typeof OAuth2;

	jest.isolateModules(() => {
		jest.doMock('meteor/accounts-base', () => ({ Accounts: accounts }), { virtual: true });
		jest.doMock('@rocket.chat/core-services', () => ({ LDAP: { loginAuthenticatedUserRequest: ldapLogin }, ClientSafeError }));
		jest.doMock('@rocket.chat/logger', () => ({ Logger: jest.fn(() => ({ debug: jest.fn() })) }));
		const { registerModel } = jest.requireActual<typeof import('@rocket.chat/models')>('@rocket.chat/models');
		registerModel('IUsersModel', users as unknown as IUsersModel);
		jest.doMock('../../../database/utils', () => ({ client: { startSession } }));
		jest.doMock('../../../settings/cached', () => ({ settings }));
		jest.doMock('../../callbacks', () => ({ callbacks: { run: runCallback } }));
		jest.doMock('../../notifyListener', () => ({ notifyOnUserChange: notify }));
		jest.doMock('@rocket.chat/license', () => ({ License: { hasModule } }));
		jest.doMock('../../users/saveUserIdentity', () => ({ saveUserIdentity: saveIdentity }));
		// Each test gets fresh service registrations and exactly one Accounts wrapper.
		Strategy = jest.requireActual<typeof import('./customOAuth')>('./customOAuth').CustomOAuthStrategy;
		oauth = jest.requireActual<typeof import('oauth')>('oauth').OAuth2;
	});

	return {
		createStrategy: (config: Partial<Config> = {}, name = 'test') => new Strategy(name, makeConfig(config), jest.fn()),
		accounts,
		originalAccountOperation,
		users,
		updater,
		session,
		startSession,
		settingValues,
		runCallback,
		notify,
		saveIdentity,
		ldapLogin,
		hasModule,
		oauth,
	};
}

describe('CustomOAuthStrategy', () => {
	let env: ReturnType<typeof setup>;

	beforeEach(() => {
		env = setup();
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	describe('configuration', () => {
		it.each([undefined, '', 42])('rejects an invalid server URL (%s)', (serverURL) => {
			expect(() => env.createStrategy({ serverURL: serverURL as string })).toThrow('serverURL is required and must be String');
		});

		it('configures Passport with provider URLs, credentials, scope and state', () => {
			const strategy = env.createStrategy();
			expect(strategy.options).toEqual({
				authorizationURL: 'https://identity.example.com/authorize',
				tokenURL: 'https://identity.example.com/token',
				clientID: 'client-id',
				clientSecret: 'client-secret',
				callbackURL: 'https://chat.example.com/_oauth/test',
				state: true,
				pkce: true,
				scope: 'openid email',
			});
			expect(strategy.name).toBe('test');
		});

		it.each(['https://chat.example.com', 'https://chat.example.com/'])('builds the callback from %s', (siteUrl) => {
			env.settingValues.set('Site_Url', siteUrl);
			expect(env.createStrategy({}, 'provider').options.callbackURL).toBe('https://chat.example.com/_oauth/provider');
		});

		it.each([true, false])('respects explicit PKCE %s', (pkce) => {
			expect(env.createStrategy({ pkce }).options.pkce).toBe(pkce);
		});

		it('defaults stored paths, claims and token parameter names', () => {
			const strategy = env.createStrategy({ tokenPath: '', identityPath: '' });
			expect(strategy.tokenPath).toBe('https://identity.example.com/oauth/token');
			expect(strategy.identityPath).toBe('https://identity.example.com/me');
			expect(strategy.rolesClaim).toBe('roles');
			expect(strategy.accessTokenParam).toBe('access_token');
		});

		it.each([
			['/profile', 'https://identity.example.com/profile'],
			['https://profile.example.com/me', 'https://profile.example.com/me'],
		])('resolves the identity path %s', (identityPath, expected) => {
			expect(env.createStrategy({ identityPath }).identityPath).toBe(expected);
		});

		it('preserves an absolute tokenPath property', () => {
			const tokenPath = 'https://tokens.example.com/token';
			expect(env.createStrategy({ tokenPath }).tokenPath).toBe(tokenPath);
		});

		it.each([undefined, 'default'] as const)('falls back to token transport when identity transport is %s', (identityTokenSentVia) => {
			const header = jest.spyOn(env.oauth.prototype, 'useAuthorizationHeaderforGET');
			const strategy = env.createStrategy({ tokenSentVia: 'header', identityTokenSentVia });
			expect(strategy.identityTokenSentVia).toBe('header');
			expect(header).toHaveBeenCalledWith(true);
		});

		it('uses an explicitly configured header transport for identity requests', () => {
			const header = jest.spyOn(env.oauth.prototype, 'useAuthorizationHeaderforGET');
			env.createStrategy({ identityTokenSentVia: 'header' });
			expect(header).toHaveBeenCalledWith(true);
		});

		it('keeps identity payload transport independent of token headers', () => {
			const header = jest.spyOn(env.oauth.prototype, 'useAuthorizationHeaderforGET');
			const strategy = env.createStrategy({ tokenSentVia: 'header', identityTokenSentVia: 'payload' });
			expect(strategy.identityTokenSentVia).toBe('payload');
			expect(header).not.toHaveBeenCalled();
		});

		it('applies a custom token parameter and role claim', () => {
			const tokenName = jest.spyOn(env.oauth.prototype, 'setAccessTokenName');
			const strategy = env.createStrategy({ accessTokenParam: 'bearer', rolesClaim: 'permissions' });
			expect(strategy.accessTokenParam).toBe('bearer');
			expect(strategy.rolesClaim).toBe('permissions');
			expect(tokenName).toHaveBeenCalledWith('bearer');
		});

		it('leaves the standard token parameter unchanged', () => {
			const tokenName = jest.spyOn(env.oauth.prototype, 'setAccessTokenName');
			env.createStrategy({ accessTokenParam: 'access_token' });
			expect(tokenName).not.toHaveBeenCalled();
			expect(env.accounts.addAutopublishFields).not.toHaveBeenCalled();
		});

		it('registers configured autopublish fields', () => {
			const fields = { forLoggedInUser: ['services.test.id'], forOtherUsers: [] };
			env.createStrategy({ addAutopublishFields: fields });
			expect(env.accounts.addAutopublishFields).toHaveBeenCalledWith(fields);
		});

		it.each([null, 'invalid'])('ignores invalid autopublish configuration %s', (addAutopublishFields) => {
			env.createStrategy({ addAutopublishFields: addAutopublishFields as unknown as Config['addAutopublishFields'] });
			expect(env.accounts.addAutopublishFields).not.toHaveBeenCalled();
		});

		it('trims identity field mappings', () => {
			const strategy = env.createStrategy({
				usernameField: ' profile.login ',
				emailField: ' profile.mail ',
				nameField: ' profile.displayName ',
				avatarField: ' profile.avatar ',
			});
			expect([strategy.usernameField, strategy.emailField, strategy.nameField, strategy.avatarField]).toEqual([
				'profile.login',
				'profile.mail',
				'profile.displayName',
				'profile.avatar',
			]);
		});
	});

	describe('identity extraction', () => {
		it.each(['usernameField', 'emailField', 'nameField', 'avatarField'] as const)(
			'preserves provider identity fields when %s is omitted',
			(field) => {
				const strategy = env.createStrategy({ [field]: undefined });
				const identity = { id: 'external-id', username: 'alice', email: 'alice@example.com', name: 'Alice Smith' };
				expect(strategy.normalizeIdentity({ ...identity })).toEqual(identity);
			},
		);

		it('preserves the provider avatar URL when no avatar mapping is configured', () => {
			const avatarUrl = 'https://identity.example.com/avatar.png';
			expect(env.createStrategy().normalizeIdentity({ id: 'external-id', avatarUrl }).avatarUrl).toBe(avatarUrl);
		});

		it('maps nested fields and templates and renames invalid persisted properties', () => {
			const strategy = env.createStrategy({
				usernameField: 'profile.login',
				emailField: 'profile.mail',
				nameField: '{{profile.first}} {{profile.last}}',
				avatarField: 'profile.avatar',
			});
			const profile = { login: 'alice', mail: 'alice@example.com', first: 'Alice', last: 'Smith', avatar: 'https://example.com/avatar' };
			expect(strategy.normalizeIdentity({ 'id': 'external-id', profile, 'custom.claim': [{ 'nested.claim': true }] })).toEqual({
				id: 'external-id',
				profile,
				username: 'alice',
				email: 'alice@example.com',
				name: 'Alice Smith',
				avatarUrl: 'https://example.com/avatar',
				custom_claim: [{ nested_claim: true }],
			});
		});

		it.each([
			['usernameField', 'getUsername', 'username'],
			['emailField', 'getEmail', 'email'],
		] as const)('wraps missing %s with the extraction error and cause', (field, method, label) => {
			const strategy = env.createStrategy({ [field]: 'profile.missing' });
			expect(() => strategy[method]({ profile: {} })).toThrow(
				expect.objectContaining({
					message: `CustomOAuth: Failed to extract ${label}`,
					cause: expect.objectContaining({ error: 'field_not_found', reason: expect.stringContaining('profile.missing') }),
				}),
			);
		});

		it.each([
			['usernameField', 'getUsername', 'username'],
			['emailField', 'getEmail', 'email'],
			['nameField', 'getCustomName', 'custom name'],
			['avatarField', 'getAvatarUrl', 'avatar url'],
		] as const)('wraps invalid expressions in %s', (field, method, label) => {
			const strategy = env.createStrategy({ [field]: '{{/+/::value}}' });
			expect(() => strategy[method]({ value: 'alice' })).toThrow(
				expect.objectContaining({ message: `CustomOAuth: Failed to extract ${label}`, cause: expect.any(SyntaxError) }),
			);
		});

		it.each(['name', 'username', 'nickname', 'CharacterName', 'userName', 'preferred_username', 'user'])('falls back to %s', (field) => {
			const strategy = env.createStrategy({ nameField: 'missing' });
			expect(strategy.getCustomName({ [field]: field === 'user' ? { name: 'Alice' } : 'Alice' })).toBe('Alice');
		});

		it('prefers the standard name over other fallback names', () => {
			expect(env.createStrategy().normalizeIdentity({ name: 'Alice', username: 'alice' }).name).toBe('Alice');
		});

		it('allows missing optional avatar and display name', () => {
			const strategy = env.createStrategy({ avatarField: 'missing', nameField: 'missing' });
			expect(strategy.getAvatarUrl({})).toBeUndefined();
			expect(strategy.getCustomName({})).toBeUndefined();
		});

		it.each([
			['_id', { _id: 'id' }, { id: 'id' }],
			['Reddit', { result: { ID: 'id' } }, { id: 'id' }],
			['WordPress', { ID: 'id' }, { id: 'id' }],
			['Auth0', { user_id: 'id' }, { id: 'id' }],
			['EVE', { CharacterID: 'id' }, { id: 'id' }],
			['Dataporten', { user: { userid: 'id', email: 'alice@example.com' } }, { id: 'id', email: 'alice@example.com' }],
			['Xenforo', { user: { user_id: 'id', user_email: 'alice@example.com' } }, { id: 'id', email: 'alice@example.com' }],
			['Phabricator', { phid: 'id' }, { id: 'id' }],
			['Keycloak', { sub: 'id' }, { id: 'id' }],
			['OpenShift', { metadata: { uid: 'id' }, fullName: 'Alice' }, { id: 'id', name: 'Alice' }],
			['userid', { userid: 'id' }, { id: 'id' }],
			[
				'Nextcloud',
				{ ocs: { data: { id: 'id', displayname: 'Alice', email: 'alice@example.com' } } },
				{ id: 'id', name: 'Alice', email: 'alice@example.com' },
			],
			['Meteor', { emails: [{ address: 'alice@example.com' }] }, { email: 'alice@example.com' }],
		])('applies the %s normalizer', (_provider, identity, expected) => {
			expect(env.createStrategy().normalizeIdentity(identity)).toMatchObject(expected);
		});
	});

	describe('account linking', () => {
		const identity = { id: 'external-id', username: 'alice', name: 'Alice Smith', email: 'alice@example.com' };
		const lookupMethods = [
			'findOneByUsernameIgnoringCase',
			'findOneByUsernameAndServiceNameIgnoringCase',
			'findOneByEmailAddress',
			'findOneByEmailAddressAndServiceNameIgnoringCase',
		] as const;
		const login = (data: Record<string, unknown> = identity, service = 'github') =>
			env.accounts.updateOrCreateUserFromExternalService(service, data, {});

		it('delegates account creation without linking an existing user when keyField is omitted', async () => {
			env.createStrategy({ keyField: undefined }, 'github');
			await login();
			expect(env.originalAccountOperation).toHaveBeenCalledWith('github', identity, {});
			for (const method of lookupMethods) {
				expect(env.users[method]).not.toHaveBeenCalled();
			}
			expect(env.runCallback).not.toHaveBeenCalled();
			expect(env.startSession).not.toHaveBeenCalled();
		});

		it.each([
			['different service', 'gitlab', identity],
			['missing username', 'github', { id: 'external-id', email: 'alice@example.com' }],
		])('does not look up or modify users for %s', async (_label, service, data) => {
			env.createStrategy({}, 'github');
			await login(data, service);
			expect(env.originalAccountOperation).toHaveBeenCalledWith(service, data, {});
			for (const method of lookupMethods) {
				expect(env.users[method]).not.toHaveBeenCalled();
			}
			expect(env.runCallback).not.toHaveBeenCalled();
			expect(env.startSession).not.toHaveBeenCalled();
		});

		it.each([
			['username', false, 'findOneByUsernameAndServiceNameIgnoringCase', ['alice', 'external-id', 'github']],
			['username', true, 'findOneByUsernameIgnoringCase', ['alice']],
			['email', false, 'findOneByEmailAddressAndServiceNameIgnoringCase', ['alice@example.com', 'external-id', 'github']],
			['email', true, 'findOneByEmailAddress', ['alice@example.com']],
		] as const)('looks up %s with cross-service merging %s', async (keyField, mergeUsersDistinctServices, method, args) => {
			env.createStrategy({ keyField, mergeUsersDistinctServices }, 'github');
			await login();
			expect(env.users[method]).toHaveBeenCalledTimes(1);
			expect(env.users[method]).toHaveBeenCalledWith(...args);
			for (const other of lookupMethods.filter((name) => name !== method)) {
				expect(env.users[other]).not.toHaveBeenCalled();
			}
			expect(env.originalAccountOperation).toHaveBeenCalled();
			expect(env.runCallback).not.toHaveBeenCalled();
			expect(env.startSession).not.toHaveBeenCalled();
		});

		it('post-processes an existing user before the original account operation', async () => {
			env.createStrategy({}, 'github');
			const user = makeUser({
				name: identity.name,
				services: { github: { id: identity.id } },
				emails: [{ address: identity.email, verified: true }],
			});
			env.users.findOneByUsernameAndServiceNameIgnoringCase.mockResolvedValue(user);
			env.originalAccountOperation.mockImplementation(() => {
				expect(env.runCallback).toHaveBeenCalledWith('afterProcessOAuthUser', { serviceName: 'github', serviceData: identity, user });
			});
			await login();
			expect(env.originalAccountOperation).toHaveBeenCalledTimes(1);
			expect(env.saveIdentity).not.toHaveBeenCalled();
			expect(env.startSession).not.toHaveBeenCalled();
		});

		it.each(['email', 'username'] as const)('does not update an unchanged linked user using %s', async (keyField) => {
			env.createStrategy({ keyField, mergeUsers: true }, 'github');
			const user = makeUser({ name: identity.name, services: { github: { id: identity.id } } });
			const method =
				keyField === 'email' ? 'findOneByEmailAddressAndServiceNameIgnoringCase' : 'findOneByUsernameAndServiceNameIgnoringCase';
			env.users[method].mockResolvedValue(user);
			const data = keyField === 'email' ? identity : { ...identity, email: undefined };
			await login(data);
			expect(env.users[method]).toHaveBeenCalled();
			expect(env.runCallback).toHaveBeenCalledWith('afterProcessOAuthUser', { serviceName: 'github', serviceData: data, user });
			expect(env.startSession).not.toHaveBeenCalled();
			expect(env.users.updateFromUpdater).not.toHaveBeenCalled();
		});

		it('rejects a collision when merging is disabled', async () => {
			env.createStrategy({}, 'github');
			env.users.findOneByUsernameAndServiceNameIgnoringCase.mockResolvedValue(makeUser());
			await expect(login()).rejects.toMatchObject({ error: 'CustomOAuth', reason: 'User with username alice already exists' });
			expect(env.runCallback).toHaveBeenCalledWith('afterProcessOAuthUser', expect.any(Object));
			expect(env.startSession).not.toHaveBeenCalled();
			expect(env.originalAccountOperation).not.toHaveBeenCalled();
			expect(env.notify).not.toHaveBeenCalled();
		});

		describe('transactions', () => {
			beforeEach(() => {
				env.createStrategy({ mergeUsers: true }, 'github');
				env.users.findOneByUsernameAndServiceNameIgnoringCase.mockResolvedValue(makeUser());
			});

			it('persists the linked ID and verified email, then notifies with the committed user diff', async () => {
				const diff = {
					name: identity.name,
					emails: [{ address: identity.email, verified: true }],
					services: { github: { id: identity.id } },
				};
				env.users.findOneById.mockResolvedValue({ _id: 'local-user', ...diff });
				const afterCommit = jest.fn();
				env.saveIdentity.mockImplementation(({ session }: { session: { onceSuccesfulCommit: (cb: () => Promise<void>) => void } }) => {
					session.onceSuccesfulCommit(afterCommit);
					return true;
				});
				const commit = Promise.withResolvers<void>();
				env.session.commitTransaction.mockReturnValue(commit.promise);
				const result = login();
				await new Promise(setImmediate);
				try {
					expect(env.session.commitTransaction).toHaveBeenCalledTimes(1);
					expect(env.notify).not.toHaveBeenCalled();
					expect(afterCommit).not.toHaveBeenCalled();
				} finally {
					commit.resolve();
					await result;
				}
				await new Promise(setImmediate);
				expect(env.session.startTransaction).toHaveBeenCalledTimes(1);
				expect(env.updater.set).toHaveBeenCalledTimes(2);
				expect(env.updater.set).toHaveBeenCalledWith('emails', [{ address: identity.email, verified: true }]);
				expect(env.updater.set).toHaveBeenCalledWith('services.github.id', identity.id);
				expect(env.saveIdentity).toHaveBeenCalledWith({
					_id: 'local-user',
					name: identity.name,
					username: 'alice',
					updater: env.updater,
					session: env.session,
					updateUsernameInBackground: true,
				});
				expect(env.users.updateFromUpdater).toHaveBeenCalledWith({ _id: 'local-user' }, env.updater, { session: env.session });
				expect(env.session.commitTransaction).toHaveBeenCalledTimes(1);
				expect(env.session.abortTransaction).not.toHaveBeenCalled();
				expect(env.session.endSession).toHaveBeenCalledTimes(1);
				expect(env.users.findOneById).toHaveBeenCalledWith('local-user', {
					projection: { 'name': 1, 'emails': 1, 'services.github.id': 1 },
				});
				expect(env.notify).toHaveBeenCalledWith({ clientAction: 'updated', id: 'local-user', diff });
				expect(afterCommit).toHaveBeenCalledTimes(1);
			});

			it.each([
				[
					'changed service ID',
					{ services: { github: { id: 'old-id' } }, name: identity.name, emails: [{ address: identity.email, verified: true }] },
				],
				[
					'changed name',
					{ services: { github: { id: identity.id } }, name: 'Old name', emails: [{ address: identity.email, verified: true }] },
				],
				[
					'changed email',
					{ services: { github: { id: identity.id } }, name: identity.name, emails: [{ address: 'old@example.com', verified: true }] },
				],
				['missing email', { services: { github: { id: identity.id } }, name: identity.name }],
			] as const)('updates a linked user with %s', async (_label, overrides) => {
				env.users.findOneByUsernameAndServiceNameIgnoringCase.mockResolvedValue({ ...makeUser(), ...overrides });
				await login();
				expect(env.saveIdentity).toHaveBeenCalledWith(expect.objectContaining({ _id: 'local-user', name: identity.name }));
				expect(env.users.updateFromUpdater).toHaveBeenCalled();
				expect(env.session.commitTransaction).toHaveBeenCalledTimes(1);
			});

			it.each([
				['email', 'findOneByEmailAddressAndServiceNameIgnoringCase', identity],
				['username', 'findOneByUsernameAndServiceNameIgnoringCase', { ...identity, email: undefined }],
			] as const)('only updates the service ID when linking by %s without an email change', async (keyField, lookupMethod, data) => {
				env.createStrategy({ keyField, mergeUsers: true }, 'github');
				env.users[lookupMethod].mockResolvedValue(makeUser());
				await login(data);
				expect(env.users[lookupMethod]).toHaveBeenCalledTimes(1);
				expect(env.updater.set.mock.calls).toEqual([['services.github.id', identity.id]]);
				expect(env.users.updateFromUpdater).toHaveBeenCalledTimes(1);
				expect(env.session.commitTransaction).toHaveBeenCalledTimes(1);
			});

			it('does not notify when the committed user can no longer be loaded', async () => {
				const loadedUser = Promise.withResolvers<IUser | null>();
				env.users.findOneById.mockReturnValue(loadedUser.promise);
				await login();
				loadedUser.resolve(null);
				await new Promise(setImmediate);
				expect(env.session.commitTransaction).toHaveBeenCalled();
				expect(env.users.findOneById).toHaveBeenCalledWith('local-user', expect.any(Object));
				expect(env.notify).not.toHaveBeenCalled();
			});

			it.each(['saveIdentity', 'updateFromUpdater', 'commitTransaction'] as const)(
				'aborts and ends the session when %s fails',
				async (stage) => {
					const error = new Error(`${stage} failed`);
					const failingOperation = {
						saveIdentity: env.saveIdentity,
						updateFromUpdater: env.users.updateFromUpdater,
						commitTransaction: env.session.commitTransaction,
					}[stage];
					const afterCommit = jest.fn();
					env.saveIdentity.mockImplementation(({ session }: { session: { onceSuccesfulCommit: (cb: () => Promise<void>) => void } }) => {
						session.onceSuccesfulCommit(afterCommit);
						return true;
					});
					failingOperation.mockRejectedValue(error);
					await expect(login()).rejects.toBe(error);
					expect(failingOperation).toHaveBeenCalledTimes(1);
					expect(env.session.startTransaction).toHaveBeenCalledTimes(1);
					expect(env.session.abortTransaction).toHaveBeenCalledTimes(1);
					expect(env.session.endSession).toHaveBeenCalledTimes(1);
					expect(env.session.commitTransaction).toHaveBeenCalledTimes(stage === 'commitTransaction' ? 1 : 0);
					expect(env.users.updateFromUpdater).toHaveBeenCalledTimes(stage === 'saveIdentity' ? 0 : 1);
					expect(env.originalAccountOperation).not.toHaveBeenCalled();
					expect(env.notify).not.toHaveBeenCalled();
					expect(afterCommit).not.toHaveBeenCalled();
				},
			);

			it('still ends the session if aborting the transaction fails', async () => {
				env.users.updateFromUpdater.mockRejectedValue(new Error('update failed'));
				env.session.abortTransaction.mockRejectedValue(new Error('abort failed'));
				await expect(login()).rejects.toThrow();
				expect(env.users.updateFromUpdater).toHaveBeenCalledTimes(1);
				expect(env.session.abortTransaction).toHaveBeenCalledTimes(1);
				expect(env.session.endSession).toHaveBeenCalledTimes(1);
				expect(env.notify).not.toHaveBeenCalled();
				expect(env.originalAccountOperation).not.toHaveBeenCalled();
			});
		});
	});

	describe('new-user validation', () => {
		it('copies configured identity fields from the matching service', () => {
			env.createStrategy({ usernameField: 'login', emailField: 'mail', nameField: 'displayName' }, 'github');
			env.createStrategy({}, 'gitlab');
			const user: IUser & { email?: string } = makeUser({
				services: { github: { id: 'id', username: 'mapped', email: 'mapped@example.com', name: 'Mapped name' } },
			});
			const validate = env.accounts.validateNewUser.mock.calls[0][0];
			expect(validate(user)).toBe(true);
			expect(user).toMatchObject({ username: 'mapped', email: 'mapped@example.com', name: 'Mapped name' });
		});

		it.each([undefined, { gitlab: { id: 'other-id' } }, { github: {} }])(
			'leaves users with no matching service ID unchanged (%j)',
			(services) => {
				env.createStrategy({ usernameField: 'login', emailField: 'mail', nameField: 'displayName' }, 'github');
				const user = makeUser({ services });
				const before = structuredClone(user);
				expect(env.accounts.validateNewUser.mock.calls[0][0](user)).toBe(true);
				expect(user).toEqual(before);
			},
		);

		it('preserves account fields when mappings are not configured', () => {
			env.createStrategy({}, 'github');
			const user = makeUser({
				services: { github: { id: 'id', username: 'different', email: 'different@example.com', name: 'Different' } },
			});
			const before = structuredClone(user);
			expect(env.accounts.validateNewUser.mock.calls[0][0](user)).toBe(true);
			expect(user).toEqual(before);
		});
	});

	describe('post-login processing', () => {
		const identity = { id: 'external-id' };
		const options = { profile: { name: 'Alice' } };
		const login = () => env.accounts.updateOrCreateUserFromExternalService('test', identity, options);

		it('passes arguments and account context through and returns the original result', async () => {
			const result = { userId: 'local-user', isNew: true };
			const user = makeUser();
			env.originalAccountOperation.mockResolvedValue(result);
			env.users.findOneById.mockResolvedValue(user);
			expect(await login()).toBe(result);
			expect(env.originalAccountOperation).toHaveBeenCalledWith('test', identity, options);
			expect(env.originalAccountOperation.mock.contexts[0]).toBe(env.accounts);
			expect(env.users.findOneById).toHaveBeenCalledWith('local-user');
			expect(env.runCallback).toHaveBeenCalledWith('afterValidateNewOAuthUser', { identity, serviceName: 'test', user });
			expect(env.ldapLogin).not.toHaveBeenCalled();
			expect(env.hasModule).not.toHaveBeenCalled();
		});

		it.each([undefined, {}])('stops when the account operation returns no user ID (%j)', async (result) => {
			env.originalAccountOperation.mockResolvedValue(result);
			expect(await login()).toBeUndefined();
			expect(env.originalAccountOperation).toHaveBeenCalledWith('test', identity, options);
			expect(env.users.findOneById).not.toHaveBeenCalled();
			expect(env.ldapLogin).not.toHaveBeenCalled();
			expect(env.runCallback).not.toHaveBeenCalled();
		});

		it('stops when the account user cannot be loaded', async () => {
			env.originalAccountOperation.mockResolvedValue({ userId: 'missing' });
			env.users.findOneById.mockResolvedValue(null);
			expect(await login()).toBeUndefined();
			expect(env.users.findOneById).toHaveBeenCalledWith('missing');
			expect(env.ldapLogin).not.toHaveBeenCalled();
			expect(env.runCallback).not.toHaveBeenCalled();
		});

		it.each([
			[true, 'alice', true],
			[false, 'alice', false],
			[true, undefined, false],
		])('refreshes LDAP only with the setting %s and username %s', async (enabled, username, refresh) => {
			const user = makeUser({ username });
			env.settingValues.set('LDAP_Update_Data_On_OAuth_Login', enabled);
			env.originalAccountOperation.mockResolvedValue({ userId: user._id });
			env.users.findOneById.mockResolvedValue(user);
			env.runCallback.mockImplementation(async () => {
				expect(env.ldapLogin.mock.calls).toEqual(refresh ? [[username]] : []);
			});
			await login();
			expect(env.ldapLogin).toHaveBeenCalledTimes(refresh ? 1 : 0);
			expect(env.runCallback).toHaveBeenCalledWith('afterValidateNewOAuthUser', { identity, serviceName: 'test', user });
		});

		it('refuses login through an admin-configured custom OAuth service without the oauth-enterprise module', async () => {
			env.settingValues.set('Accounts_OAuth_Custom-Test', true);
			expect(await login()).toBeUndefined();
			expect(env.hasModule).toHaveBeenCalledWith('oauth-enterprise');
			expect(env.originalAccountOperation).not.toHaveBeenCalled();
		});

		it('allows login through an admin-configured custom OAuth service with the oauth-enterprise module', async () => {
			env.settingValues.set('Accounts_OAuth_Custom-Test', true);
			env.hasModule.mockReturnValue(true);
			await login();
			expect(env.originalAccountOperation).toHaveBeenCalled();
		});

		it('propagates account-operation failures without post-login effects', async () => {
			const error = new Error('account creation failed');
			env.originalAccountOperation.mockRejectedValue(error);
			await expect(login()).rejects.toBe(error);
			expect(env.originalAccountOperation).toHaveBeenCalled();
			expect(env.users.findOneById).not.toHaveBeenCalled();
			expect(env.ldapLogin).not.toHaveBeenCalled();
			expect(env.runCallback).not.toHaveBeenCalled();
		});

		it('propagates LDAP failures before post-validation callbacks', async () => {
			const error = new Error('LDAP unavailable');
			env.settingValues.set('LDAP_Update_Data_On_OAuth_Login', true);
			env.originalAccountOperation.mockResolvedValue({ userId: 'local-user' });
			env.users.findOneById.mockResolvedValue(makeUser());
			env.ldapLogin.mockRejectedValue(error);
			await expect(login()).rejects.toBe(error);
			expect(env.ldapLogin).toHaveBeenCalledWith('alice');
			expect(env.runCallback).not.toHaveBeenCalled();
		});
	});

	describe('provider responses', () => {
		let strategy: CustomOAuthStrategy;
		let get: jest.SpiedFunction<OAuth2['get']>;
		let done: jest.Mock;

		const respondWith = (body: string | Buffer, statusCode = 200) => {
			get.mockImplementation((_url, _token, callback) => {
				// @types/oauth omits null from successful response errors.
				const respond = callback as (error: { statusCode: number } | null, body: string | Buffer, response: { statusCode: number }) => void;
				respond(null, body, { statusCode });
			});
		};

		beforeEach(() => {
			strategy = env.createStrategy({ usernameField: 'login' });
			get = jest.spyOn(env.oauth.prototype, 'get').mockImplementation(() => undefined);
			done = jest.fn();
		});

		it('rejects a missing identity path before requesting the provider', () => {
			strategy.identityPath = '';
			strategy.userProfile('token', done);
			expect(done).toHaveBeenCalledTimes(1);
			expect(done).toHaveBeenCalledWith(new Error('identityPath is required for test custom oauth'));
			expect(get).not.toHaveBeenCalled();
		});

		it('reports a provider request failure without normalizing or returning a profile', () => {
			const error = { statusCode: 401, data: 'expired token' };
			const normalize = jest.spyOn(strategy, 'normalizeIdentity');
			get.mockImplementation((_url, _token, callback) => callback(error, '{"login":"alice"}'));
			strategy.userProfile('token', done);
			expect(done).toHaveBeenCalledTimes(1);
			expect(get).toHaveBeenCalledWith(strategy.identityPath, 'token', expect.any(Function));
			expect(done).toHaveBeenCalledWith(JSON.stringify(error));
			expect(done.mock.calls[0][1]).toBeUndefined();
			expect(normalize).not.toHaveBeenCalled();
		});

		it.each([
			['non-success status', 403, '{"login":"alice"}'],
			['empty body', 200, ''],
		] as const)('rejects a response with %s', (_label, statusCode, body) => {
			respondWith(body, statusCode);
			strategy.userProfile('token', done);
			expect(done).toHaveBeenCalledTimes(1);
			expect(get).toHaveBeenCalledTimes(1);
			expect(done).toHaveBeenCalledWith(
				expect.objectContaining({ message: expect.stringContaining('Failed to fetch identity from test') }),
			);
		});

		it.each(['string', 'buffer'])('parses a %s response, normalizes it and includes the provider URL', (format) => {
			const json = JSON.stringify({ sub: 'id', login: 'alice' });
			respondWith(format === 'string' ? json : Buffer.from(json));
			strategy.userProfile('token', done);
			expect(done).toHaveBeenCalledTimes(1);
			expect(get).toHaveBeenCalledWith('https://identity.example.com/profile', 'token', expect.any(Function));
			expect(done).toHaveBeenCalledWith(null, {
				sub: 'id',
				id: 'id',
				login: 'alice',
				username: 'alice',
				name: 'alice',
				serverURL: 'https://identity.example.com',
			});
		});

		it.each([
			['invalid JSON', '{', 'SyntaxError'],
			['missing username', '{}', 'Failed to extract username'],
		])('returns a descriptive parsing or normalization failure for %s', (_label, body, cause) => {
			respondWith(body);
			strategy.userProfile('token', done);
			expect(done).toHaveBeenCalledTimes(1);
			expect(get).toHaveBeenCalledTimes(1);
			expect(done).toHaveBeenCalledWith(
				expect.objectContaining({ message: expect.stringContaining(`Failed to parse identity from test at ${strategy.identityPath}.`) }),
			);
			expect(done.mock.calls[0][0].message).toContain(cause);
		});

		it.each(['login', undefined])('rejects a null identity with username mapping %s without returning a profile', (usernameField) => {
			strategy = env.createStrategy({ usernameField });
			respondWith('null');
			strategy.userProfile('token', done);
			expect(get).toHaveBeenCalledTimes(1);
			expect(done).toHaveBeenCalledTimes(1);
			expect(done.mock.calls[0][0]).toBeInstanceOf(Error);
			expect(done.mock.calls[0][1]).toBeUndefined();
		});
	});
});

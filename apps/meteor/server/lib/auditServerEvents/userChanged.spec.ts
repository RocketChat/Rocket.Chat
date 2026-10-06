import { faker } from '@faker-js/faker';
import type { IAuditServerUserActor, IUser } from '@rocket.chat/core-typings';
import type { Updater } from '@rocket.chat/models';
import { UpdaterImpl } from '@rocket.chat/models';

import { UserChangedAuditStore } from './userChanged';
import { createFakeUser } from '../../../tests/mocks/data';

const makeFakeActor = (): Omit<IAuditServerUserActor, 'type'> => {
	return {
		ip: faker.internet.ip(),
		useragent: faker.internet.userAgent(),
		_id: faker.database.mongodbObjectId(),
		username: faker.internet.userName(),
	};
};

const createUserAndUpdater = (overrides?: Partial<IUser>): [IUser, Updater<IUser>, Omit<IAuditServerUserActor, 'type'>] => {
	const originalUser = createFakeUser(overrides);
	const updater = new UpdaterImpl<IUser>();

	const actor = makeFakeActor();

	return [originalUser, updater, actor];
};

const createEmailsField = (address?: string, verified = true) => {
	return {
		emails: [
			{
				address: address || faker.internet.email(),
				verified,
			},
		],
	};
};

jest.mock('@rocket.chat/models', () => {
	return {
		UpdaterImpl: jest.requireActual('@rocket.chat/models').UpdaterImpl,
		ServerEvents: {
			createAuditServerEvent: (...args: any) => args,
		},
	};
});

const createObfuscatedFields = (_2faEnabled = true): Pick<IUser, 'services' | 'e2e' | 'oauth'> => {
	return {
		services: {
			password: {
				bcrypt: faker.string.uuid(),
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore this field is not in IUser, but is present in DB
				enroll: {
					token: faker.string.uuid(),
					email: faker.internet.email(),
					when: faker.date.past(),
					reason: 'enroll',
				},
			},
			email2fa: {
				enabled: _2faEnabled,
				changedAt: faker.date.past(),
			},
			email: {
				verificationTokens: [
					{
						token: faker.string.uuid(),
						address: faker.internet.email(),
						when: faker.date.past(),
					},
				],
			},
			resume: {
				loginTokens: [
					{
						when: faker.date.past(),
						hashedToken: faker.string.uuid(),
						twoFactorAuthorizedHash: faker.string.uuid(),
						twoFactorAuthorizedUntil: faker.date.past(),
					},
				],
			},
		},
		e2e: {
			private_key: faker.string.uuid(),
			public_key: faker.string.uuid(),
		},
		inviteToken: faker.string.uuid(),
		oauth: { authorizedClients: [faker.string.uuid(), faker.string.uuid()] },
	};
};

const getObfuscatedFields = (email2faState: { enabled: boolean; changedAt: Date }) => ({
	e2e: '****',
	oauth: '****',
	inviteToken: '****',
	services: getObfuscatedServices(email2faState),
});

const getObfuscatedServices = (email2faState: { enabled: boolean; changedAt: Date }) => {
	return {
		password: '****',
		email2fa: email2faState,
		email: '****',
		resume: '****',
	};
};

describe('userChanged audit module', () => {
	it('should build event with only name and username fields', async () => {
		const [user, updater, actor] = createUserAndUpdater({ ...createEmailsField() });

		const store = new UserChangedAuditStore(actor);

		const [newUsername, newName] = [faker.internet.userName(), faker.person.fullName()];

		updater.set('username', newUsername);
		updater.set('name', newName);

		store.setOriginalUser(user as IUser);
		store.setUpdateFilter(updater.getUpdateFilter());

		const event = await store.commitAuditEvent();

		expect(event).toEqual([
			'user.changed',
			{
				user: { _id: user._id, username: user.username },
				user_data: { username: user.username, name: user.name },
				operation: { $set: { username: newUsername, name: newName } },
			},
			{ ...actor, type: 'user' },
		]);
	});

	it('should build event with only emails field', async () => {
		const [user, updater, actor] = createUserAndUpdater({ ...createEmailsField() });

		const store = new UserChangedAuditStore(actor);

		const newEmailsField = createEmailsField();

		updater.set('emails', newEmailsField.emails);

		store.setOriginalUser(user as IUser);
		store.setUpdateFilter(updater.getUpdateFilter());

		const event = await store.commitAuditEvent();

		expect(event).toEqual([
			'user.changed',
			{
				user: { _id: user._id, username: user.username },
				operation: { $set: { ...newEmailsField } },
				user_data: { emails: user.emails },
			},
			{ ...actor, type: 'user' },
		]);
	});

	it('should build event with every changed field', async () => {
		const [user, updater, actor] = createUserAndUpdater({ ...createEmailsField(), active: false });

		const changes = {
			...createFakeUser(),
			...createEmailsField(),
			type: 'bot',
			active: true,
		};

		Object.entries(changes).forEach(([key, value]: any) => {
			updater.set(key, value);
		});

		updater.addToSet('roles', 'user');
		updater.addToSet('roles', 'bot');

		const store = new UserChangedAuditStore(actor);

		store.setOriginalUser(user as IUser);
		store.setUpdateFilter(updater.getUpdateFilter());

		const event = await store.commitAuditEvent();

		expect(event).toEqual([
			'user.changed',
			{
				user: { _id: user._id, username: user.username },
				user_data: user,
				operation: {
					$set: {
						...changes,
					},
					$addToSet: {
						roles: { $each: ['user', 'bot'] },
					},
				},
			},
			{
				...actor,
				type: 'user',
			},
		]);
	});
	it('should obfuscate sensitive fields', async () => {
		const [user, updater, actor] = createUserAndUpdater({ ...createEmailsField(), ...createObfuscatedFields(false), active: false });

		const store = new UserChangedAuditStore(actor);

		const changes = {
			...createFakeUser(),
			...createEmailsField(),
			...createObfuscatedFields(true),
			type: 'bot',
			active: true,
		};

		Object.entries(changes).forEach(([key, value]: any) => {
			updater.set(key, value);
		});

		updater.addToSet('roles', 'user');
		updater.addToSet('roles', 'bot');

		store.setOriginalUser(user as IUser);
		store.setUpdateFilter(updater.getUpdateFilter());

		const event = await store.commitAuditEvent();

		expect(event).toEqual([
			'user.changed',
			{
				user: { _id: user._id, username: user.username },
				user_data: { ...user, ...getObfuscatedFields(user.services?.email2fa as any) },
				operation: {
					$set: {
						...changes,
						...getObfuscatedFields(changes.services?.email2fa as any),
					},
					$addToSet: {
						roles: { $each: ['user', 'bot'] },
					},
				},
			},
			{
				...actor,
				type: 'user',
			},
		]);
	});
	it('should obfuscate nested services', async () => {
		const [user, updater, actor] = createUserAndUpdater({ ...createEmailsField(), ...createObfuscatedFields(false), active: false });

		const store = new UserChangedAuditStore(actor);

		updater.set('services.password.bcrypt', faker.string.uuid());
		updater.set('services.resume.loginTokens', faker.string.uuid());

		store.setOriginalUser(user as IUser);
		store.setUpdateFilter(updater.getUpdateFilter());

		const event = await store.commitAuditEvent();

		expect(event).toEqual([
			'user.changed',
			{
				user: { _id: user._id, username: user.username },
				user_data: { services: { password: '****', resume: '****' } },
				operation: { $set: { 'services.password.bcrypt': '****', 'services.resume.loginTokens': '****' } },
			},
			{ ...actor, type: 'user' },
		]);
	});
	it('should obfuscate all services when they are set at once', async () => {
		const [user, updater, actor] = createUserAndUpdater({ ...createEmailsField(), ...createObfuscatedFields(false), active: false });

		const store = new UserChangedAuditStore(actor);

		updater.set('services', { password: { bcrypt: faker.string.uuid() } });

		store.setOriginalUser(user as IUser);
		store.setUpdateFilter(updater.getUpdateFilter());

		const event = await store.commitAuditEvent();

		expect(event).toEqual([
			'user.changed',
			{
				user: { _id: user._id, username: user.username },
				user_data: { services: getObfuscatedServices(user.services?.email2fa as any) },
				operation: { $set: { services: { password: '****' } } },
			},
			{ ...actor, type: 'user' },
		]);
	});
});

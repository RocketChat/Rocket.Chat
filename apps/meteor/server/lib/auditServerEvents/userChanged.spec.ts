import { faker } from '@faker-js/faker';
import type { IAuditServerUserActor, IUser } from '@rocket.chat/core-typings';

import { UserChangedLogStore } from './userChanged';
import { createFakeUser } from '../../../tests/mocks/data';

const createChangedUserAndActor = (
	changes: Partial<IUser>,
	overrides?: Partial<IUser>,
): [IUser, IUser, Omit<IAuditServerUserActor, 'type'>] => {
	const originalUser = createFakeUser(overrides);
	const currentUser: IUser = {
		...originalUser,
		...changes,
	};

	const actor: Omit<IAuditServerUserActor, 'type'> = {
		ip: 'actorIp',
		useragent: 'actorUserAgent',
		_id: 'actorId',
		username: 'actorUsername',
	};

	return [originalUser, currentUser, actor];
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
	e2e: '***',
	oauth: '***',
	inviteToken: '***',
	services: {
		password: '***',
		email2fa: email2faState,
		email: '***',
		resume: '***',
	},
});

describe('userChanged audit module', () => {
	it('should build event with only name and username fields', async () => {
		const store = new UserChangedLogStore();

		const [originalUser, currentUser, actor] = createChangedUserAndActor(
			{
				username: 'newUsername',
				name: 'newName',
			},
			{ ...createEmailsField() },
		);

		store.setOriginalUser(originalUser as IUser);
		store.setCurrentUser(currentUser as IUser);
		store.setActor(actor);

		const event = store.buildEvent();

		expect(event).toEqual([
			'user.changed',
			{
				user: { _id: currentUser._id, username: currentUser.username },
				previous: { username: originalUser.username, name: originalUser.name },
				current: { username: currentUser.username, name: currentUser.name },
			},
			{
				ip: 'actorIp',
				useragent: 'actorUserAgent',
				_id: 'actorId',
				username: 'actorUsername',
				type: 'user',
			},
		]);
	});
	it('should build event with only emails field', async () => {
		const store = new UserChangedLogStore();

		const [originalUser, currentUser, actor] = createChangedUserAndActor(
			{
				...createEmailsField(),
			},
			{ ...createEmailsField() },
		);

		store.setOriginalUser(originalUser as IUser);
		store.setCurrentUser(currentUser as IUser);
		store.setActor(actor);

		const event = store.buildEvent();

		expect(event).toEqual([
			'user.changed',
			{
				user: { _id: currentUser._id, username: currentUser.username },
				previous: { emails: originalUser.emails },
				current: { emails: currentUser.emails },
			},
			{
				ip: 'actorIp',
				useragent: 'actorUserAgent',
				_id: 'actorId',
				username: 'actorUsername',
				type: 'user',
			},
		]);
	});
	it('should build event with every changed field', async () => {
		const store = new UserChangedLogStore();

		const [originalUser, currentUser, actor] = createChangedUserAndActor(
			{
				...createFakeUser(),
				...createEmailsField(),
				type: 'bot',
				active: true,
				roles: ['user', 'bot'],
			},
			{ ...createEmailsField(), active: false },
		);

		store.setOriginalUser(originalUser as IUser);
		store.setCurrentUser(currentUser as IUser);
		store.setActor(actor);

		const event = store.buildEvent();

		expect(event).toEqual([
			'user.changed',
			{
				user: { _id: currentUser._id, username: currentUser.username },
				previous: originalUser,
				current: currentUser,
			},
			{
				ip: 'actorIp',
				useragent: 'actorUserAgent',
				_id: 'actorId',
				username: 'actorUsername',
				type: 'user',
			},
		]);
	});
	it('should obfuscate sensitive fields', async () => {
		const store = new UserChangedLogStore();

		const [originalUser, currentUser, actor] = createChangedUserAndActor(
			{
				...createFakeUser(),
				...createEmailsField(),
				...createObfuscatedFields(true),
				type: 'bot',
				active: true,
				roles: ['user', 'bot'],
			},
			{ ...createEmailsField(), ...createObfuscatedFields(false), active: false },
		);

		store.setOriginalUser(originalUser as IUser);
		store.setCurrentUser(currentUser as IUser);
		store.setActor(actor);

		const event = store.buildEvent();

		expect(event).toEqual([
			'user.changed',
			{
				user: { _id: currentUser._id, username: currentUser.username },
				previous: { ...originalUser, ...getObfuscatedFields(originalUser.services?.email2fa as any) },
				current: { ...currentUser, ...getObfuscatedFields(currentUser.services?.email2fa as any) },
			},
			{
				ip: 'actorIp',
				useragent: 'actorUserAgent',
				_id: 'actorId',
				username: 'actorUsername',
				type: 'user',
			},
		]);
	});
});

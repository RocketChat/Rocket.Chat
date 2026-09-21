import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import { RocketChatAssociationModel } from '@rocket.chat/apps-engine/definition/metadata/RocketChatAssociations';
import type { IUser } from '@rocket.chat/apps-engine/definition/users/IUser';

import { UserBuilder } from '../UserBuilder';

describe('UserBuilder', () => {
	it('defaults to an empty user when constructed without one', () => {
		const builder = new UserBuilder();

		assert.strictEqual(builder.kind, RocketChatAssociationModel.USER);
		assert.strictEqual(builder.getEmails(), undefined);
		assert.strictEqual(builder.getDisplayName(), undefined);
		assert.strictEqual(builder.getUsername(), undefined);
		assert.strictEqual(builder.getRoles(), undefined);
	});

	it('starts from the provided partial user when constructed with one', () => {
		const builder = new UserBuilder({ username: 'seed-user', name: 'Seed User' });

		assert.strictEqual(builder.getUsername(), 'seed-user');
		assert.strictEqual(builder.getDisplayName(), 'Seed User');
	});

	it('setData() replaces the whole user, ignoring any "id" field per the interface contract', () => {
		const builder = new UserBuilder({ username: 'old-username' });

		const result = builder.setData({ id: 'should-be-ignored', username: 'new-username', name: 'New Name' } as Partial<IUser>);

		assert.strictEqual(result, builder, 'setData() should return the builder for chaining');
		assert.strictEqual(builder.getUsername(), 'new-username');
		assert.strictEqual(builder.getDisplayName(), 'New Name');
		assert.strictEqual((builder.getUser() as Partial<IUser>).id, undefined);
	});

	it('setEmails()/getEmails() round-trip and support chaining', () => {
		const builder = new UserBuilder({ username: 'u', name: 'U' });
		const emails = [{ address: 'a@example.com', verified: true }];

		const result = builder.setEmails(emails);

		assert.strictEqual(result, builder);
		assert.deepStrictEqual(builder.getEmails(), emails);
	});

	it('setDisplayName()/getDisplayName() round-trip and support chaining', () => {
		const builder = new UserBuilder({ username: 'u' });

		const result = builder.setDisplayName('Display Name');

		assert.strictEqual(result, builder);
		assert.strictEqual(builder.getDisplayName(), 'Display Name');
	});

	it('setUsername()/getUsername() round-trip and support chaining', () => {
		const builder = new UserBuilder({ name: 'Name Only' });

		const result = builder.setUsername('new-username');

		assert.strictEqual(result, builder);
		assert.strictEqual(builder.getUsername(), 'new-username');
	});

	it('setRoles()/getRoles() round-trip and support chaining', () => {
		const builder = new UserBuilder({ username: 'u', name: 'U' });

		const result = builder.setRoles(['admin', 'user']);

		assert.strictEqual(result, builder);
		assert.deepStrictEqual(builder.getRoles(), ['admin', 'user']);
	});

	it('getSettings() reflects whatever settings were provided on construction', () => {
		const settings = { preferredLanguage: 'en' };
		const builder = new UserBuilder({ username: 'u', name: 'U', settings: settings as IUser['settings'] });

		assert.deepStrictEqual(builder.getSettings(), settings);
	});

	describe('getUser()', () => {
		it('throws when "username" is missing', () => {
			const builder = new UserBuilder({ name: 'Has Name Only' });

			assert.throws(() => builder.getUser(), { message: 'The "username" property is required.' });
		});

		it('throws when "name" is missing', () => {
			const builder = new UserBuilder({ username: 'has-username-only' });

			assert.throws(() => builder.getUser(), { message: 'The "name" property is required.' });
		});

		it('returns the built user when both "username" and "name" are set', () => {
			// Not chained: setDisplayName() returns the IUserBuilder interface type, which doesn't
			// declare setRoles() - only the concrete UserBuilder class does.
			const builder = new UserBuilder();
			builder.setUsername('final-username');
			builder.setDisplayName('Final Name');
			builder.setRoles(['user']);

			assert.deepStrictEqual(builder.getUser(), {
				username: 'final-username',
				name: 'Final Name',
				roles: ['user'],
			});
		});
	});
});

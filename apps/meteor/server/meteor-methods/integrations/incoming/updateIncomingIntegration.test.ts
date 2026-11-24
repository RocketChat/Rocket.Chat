import { afterEach, before, beforeEach, describe, it, mock } from 'node:test';

import { ClientSafeError } from '@rocket.chat/core-services';
import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import sinon from 'sinon';

const permissions: Record<string, string[]> = {};
const hasPermissionAsync = sinon.stub();
const hasAllPermissionAsync = sinon.stub();
const validateScriptEngine = sinon.stub();
const isScriptEngineFrozen = sinon.stub();
const validateScriptSyntax = sinon.stub();
const notifyOnIntegrationChanged = sinon.stub();

const integrationsFindOneById = sinon.stub();
const integrationsFindOne = sinon.stub();
const integrationsUpdateOne = sinon.stub();
const integrationsFindOneAndUpdate = sinon.stub();
const roomsFindOne = sinon.stub();
const usersFindOne = sinon.stub();
const usersFindOneByUsername = sinon.stub();
const subscriptionsFindOneByRoomIdAndUserId = sinon.stub();

const moduleMocks = [
	mock.module('@rocket.chat/core-services', { exports: { ClientSafeError } }),
	mock.module('../../../lib/authorization/hasPermission', { exports: { hasAllPermissionAsync, hasPermissionAsync } }),
	mock.module('../../../lib/integrations/lib/validateScriptEngine', { exports: { isScriptEngineFrozen, validateScriptEngine } }),
	mock.module('../../../lib/integrations/lib/validateScriptSyntax', { exports: { validateScriptSyntax } }),
	mock.module('../../../lib/notifyListener', { exports: { notifyOnIntegrationChanged } }),
];
// oxlint-disable-next-line @typescript-eslint/no-require-imports
const { updateIncomingIntegration } = require('./updateIncomingIntegration');

moduleMocks.forEach((moduleMock) => moduleMock.restore());

const NOW = new Date('2026-01-01T12:00:00.000Z');
const updatedBy = { _id: 'user-id', username: 'admin' };
const postAsUser = { _id: 'bot-id', username: 'bot' };

describe('updateIncomingIntegration', () => {
	let clock: sinon.SinonFakeTimers;
	let currentIntegration: any;

	before(() => {
		mockModel('Integrations', {
			findOneById: integrationsFindOneById,
			findOne: integrationsFindOne,
			updateOne: integrationsUpdateOne,
			findOneAndUpdate: integrationsFindOneAndUpdate,
		});
		mockModel('Rooms', { findOne: roomsFindOne });
		mockModel('Users', { findOne: usersFindOne, findOneByUsername: usersFindOneByUsername });
		mockModel('Subscriptions', { findOneByRoomIdAndUserId: subscriptionsFindOneByRoomIdAndUserId });
	});

	beforeEach(() => {
		clock = sinon.useFakeTimers({ now: NOW, toFake: ['Date'] });
		permissions['user-id'] = ['manage-incoming-integrations'];
		permissions['bot-id'] = ['message-impersonate'];
		hasPermissionAsync.reset();
		hasPermissionAsync.callsFake(async (uid: string, permission: string) => permissions[uid]?.includes(permission) ?? false);
		hasAllPermissionAsync.reset();
		hasAllPermissionAsync.resolves(true);
		validateScriptEngine.reset();
		isScriptEngineFrozen.reset();
		isScriptEngineFrozen.returns(false);
		validateScriptSyntax.reset();
		validateScriptSyntax.returns({ script: 'compiled' });
		notifyOnIntegrationChanged.reset();

		currentIntegration = { _id: 'integration-id', username: 'bot', script: 'return 1;', scriptEngine: 'isolated-vm' };
		integrationsFindOneById.reset();
		integrationsFindOneById.resolves(currentIntegration);
		integrationsFindOne.reset();
		integrationsFindOne.resolves(currentIntegration);
		integrationsUpdateOne.reset();
		integrationsFindOneAndUpdate.reset();
		integrationsFindOneAndUpdate.resolves({ _id: 'integration-id', updated: true });
		roomsFindOne.reset();
		roomsFindOne.resolves({ _id: 'room-id' });
		usersFindOne.reset();
		usersFindOne.withArgs({ _id: 'user-id' }).resolves(updatedBy);
		usersFindOne.resolves({ _id: 'target-user-id' });
		usersFindOneByUsername.reset();
		usersFindOneByUsername.resolves(postAsUser);
		subscriptionsFindOneByRoomIdAndUserId.reset();
		subscriptionsFindOneByRoomIdAndUserId.resolves({ _id: 'subscription-id' });
	});

	afterEach(() => {
		clock.restore();
	});

	for (const channel of [undefined, '', '   ']) {
		it(`should reject the channel ${JSON.stringify(channel)} before checking permissions`, async () => {
			await expect(updateIncomingIntegration('user-id', 'integration-id', { channel })).to.be.rejectedWith(
				ClientSafeError,
				'[error-invalid-channel]',
			);
			expect(hasPermissionAsync.called).to.equal(false);
		});
	}

	it('should reject a channel that does not start with @ or #', async () => {
		await expect(updateIncomingIntegration('user-id', 'integration-id', { channel: '#general, random' })).to.be.rejectedWith(
			ClientSafeError,
			'[error-invalid-channel-start-with-chars]',
		);
		expect(hasPermissionAsync.called).to.equal(false);
	});

	it('should load any integration for a user who manages incoming integrations', async () => {
		await updateIncomingIntegration('user-id', 'integration-id', { channel: '#general' });

		expect(integrationsFindOneById.calledOnceWithExactly('integration-id')).to.equal(true);
		expect(integrationsFindOne.called).to.equal(false);
	});

	it('should load only an own integration for a user who manages their own incoming integrations', async () => {
		permissions['user-id'] = ['manage-own-incoming-integrations'];

		await updateIncomingIntegration('user-id', 'integration-id', { channel: '#general' });

		expect(integrationsFindOneById.called).to.equal(false);
		expect(integrationsFindOne.calledOnceWithExactly({ '_id': 'integration-id', '_createdBy._id': 'user-id' })).to.equal(true);
	});

	it('should reject a user without integration permissions', async () => {
		permissions['user-id'] = [];

		await expect(updateIncomingIntegration('user-id', 'integration-id', { channel: '#general' })).to.be.rejectedWith(
			ClientSafeError,
			'[not_authorized]',
		);
		expect(integrationsFindOneById.called).to.equal(false);
		expect(integrationsFindOne.called).to.equal(false);
	});

	it('should reject an integration that was not found', async () => {
		integrationsFindOneById.resolves(null);

		await expect(updateIncomingIntegration('user-id', 'integration-id', { channel: '#general' })).to.be.rejectedWith(
			ClientSafeError,
			'[error-invalid-integration]',
		);
		expect(isScriptEngineFrozen.called).to.equal(false);
	});

	it('should validate the script engine when the script changes', async () => {
		await updateIncomingIntegration('user-id', 'integration-id', { channel: '#general', script: 'return 2;' });

		expect(validateScriptEngine.calledOnceWithExactly('isolated-vm')).to.equal(true);
	});

	it('should validate the script engine when the engine changes', async () => {
		await updateIncomingIntegration('user-id', 'integration-id', { channel: '#general', script: 'return 1;', scriptEngine: 'vm2' });

		expect(validateScriptEngine.calledOnceWithExactly('vm2')).to.equal(true);
		expect(isScriptEngineFrozen.calledOnceWithExactly('vm2')).to.equal(true);
	});

	it('should default the script engine to isolated-vm', async () => {
		delete currentIntegration.scriptEngine;

		await updateIncomingIntegration('user-id', 'integration-id', { channel: '#general', script: 'return 1;' });

		expect(validateScriptEngine.calledOnceWithExactly('isolated-vm')).to.equal(true);
		expect(integrationsFindOneAndUpdate.firstCall.args[1].$set.scriptEngine).to.equal('isolated-vm');
	});

	it('should not validate the script engine when the trimmed script and engine are unchanged', async () => {
		await updateIncomingIntegration('user-id', 'integration-id', { channel: '#general', script: '  return 1;  ' });

		expect(validateScriptEngine.called).to.equal(false);
	});

	it('should not validate the script engine for a blank script', async () => {
		await updateIncomingIntegration('user-id', 'integration-id', { channel: '#general', script: '   ', scriptEngine: 'vm2' });

		expect(validateScriptEngine.called).to.equal(false);
	});

	it('should turn a script engine validation failure into a ClientSafeError', async () => {
		validateScriptEngine.throws(new Error('integration-scripts-disabled'));

		const error = await updateIncomingIntegration('user-id', 'integration-id', { channel: '#general', script: 'return 2;' }).catch(
			(e: unknown) => e,
		);

		expect(error).to.be.instanceOf(ClientSafeError);
		expect(error.error).to.equal('integration-scripts-disabled');
		expect(isScriptEngineFrozen.called).to.equal(false);
		expect(integrationsFindOneAndUpdate.called).to.equal(false);
	});

	it('should save the compiled script when the enabled script is valid', async () => {
		await updateIncomingIntegration('user-id', 'integration-id', { channel: '#general', script: 'return 2;', scriptEnabled: true });

		expect(validateScriptSyntax.calledOnceWithExactly('return 2;')).to.equal(true);
		expect(
			integrationsUpdateOne.calledOnceWithExactly(
				{ _id: 'integration-id' },
				{ $set: { scriptCompiled: 'compiled' }, $unset: { scriptError: 1 } },
			),
		).to.equal(true);
	});

	it('should save the script error when the enabled script is invalid', async () => {
		const syntaxError = { name: 'SyntaxError', message: 'Unexpected token', stack: '' };
		validateScriptSyntax.returns({ error: syntaxError });

		await updateIncomingIntegration('user-id', 'integration-id', { channel: '#general', script: 'return (', scriptEnabled: true });

		expect(
			integrationsUpdateOne.calledOnceWithExactly(
				{ _id: 'integration-id' },
				{ $set: { scriptError: syntaxError }, $unset: { scriptCompiled: 1 } },
			),
		).to.equal(true);
	});

	it('should not compile the script when the engine is frozen', async () => {
		isScriptEngineFrozen.returns(true);

		await updateIncomingIntegration('user-id', 'integration-id', { channel: '#general', script: 'return 2;', scriptEnabled: true });

		expect(validateScriptSyntax.called).to.equal(false);
		expect(integrationsUpdateOne.called).to.equal(false);
	});

	for (const integration of [
		{ script: 'return 2;', scriptEnabled: false },
		{ script: '   ', scriptEnabled: true },
		{ scriptEnabled: true },
	]) {
		it(`should not compile the script for ${JSON.stringify(integration)}`, async () => {
			await updateIncomingIntegration('user-id', 'integration-id', { channel: '#general', ...integration });

			expect(validateScriptSyntax.called).to.equal(false);
			expect(integrationsUpdateOne.called).to.equal(false);
		});
	}

	it('should look up each trimmed channel as a room or a user', async () => {
		await updateIncomingIntegration('user-id', 'integration-id', { channel: ' #general , @john ' });

		expect(roomsFindOne.calledOnceWithExactly({ $or: [{ _id: 'general' }, { name: 'general' }] })).to.equal(true);
		expect(usersFindOne.firstCall.args).to.deep.equal([{ $or: [{ _id: 'john' }, { username: 'john' }] }]);
		expect(
			hasAllPermissionAsync.alwaysCalledWithExactly('user-id', ['manage-incoming-integrations', 'manage-own-incoming-integrations']),
		).to.equal(true);
		expect(hasAllPermissionAsync.callCount).to.equal(2);
		expect(subscriptionsFindOneByRoomIdAndUserId.called).to.equal(false);
		expect(integrationsFindOneAndUpdate.firstCall.args[1].$set.channel).to.deep.equal(['#general', '@john']);
	});

	it('should reject a channel whose room is not found, after saving the compiled script', async () => {
		roomsFindOne.resolves(null);

		await expect(
			updateIncomingIntegration('user-id', 'integration-id', { channel: '#missing', script: 'return 2;', scriptEnabled: true }),
		).to.be.rejectedWith(ClientSafeError, '[error-invalid-room]');
		expect(integrationsUpdateOne.calledOnce).to.equal(true);
		expect(usersFindOneByUsername.called).to.equal(false);
	});

	it('should reject a channel whose user is not found', async () => {
		usersFindOne.resolves(null);

		await expect(updateIncomingIntegration('user-id', 'integration-id', { channel: '@missing' })).to.be.rejectedWith(
			ClientSafeError,
			'[error-invalid-room]',
		);
	});

	it('should accept a channel the user is subscribed to when not holding both manage permissions', async () => {
		hasAllPermissionAsync.resolves(false);

		await updateIncomingIntegration('user-id', 'integration-id', { channel: '#general' });

		expect(subscriptionsFindOneByRoomIdAndUserId.calledOnceWithExactly('room-id', 'user-id', { projection: { _id: 1 } })).to.equal(true);
		expect(integrationsFindOneAndUpdate.calledOnce).to.equal(true);
	});

	it('should reject a channel the user is not subscribed to when not holding both manage permissions', async () => {
		hasAllPermissionAsync.resolves(false);
		subscriptionsFindOneByRoomIdAndUserId.resolves(null);

		const error = await updateIncomingIntegration('user-id', 'integration-id', { channel: '#general' }).catch((e: unknown) => e);

		expect(error).to.be.instanceOf(ClientSafeError);
		expect(error).to.include({ error: 'error-invalid-channel', reason: 'Invalid Channel' });
		expect(usersFindOneByUsername.called).to.equal(false);
	});

	it('should post as the requested user when username is provided', async () => {
		await updateIncomingIntegration('user-id', 'integration-id', { channel: '#general', username: 'other' });

		expect(usersFindOneByUsername.calledOnceWithExactly('other', { projection: { _id: 1, username: 1 } })).to.equal(true);
		expect(integrationsFindOneAndUpdate.firstCall.args[1].$set).to.include({ username: 'bot', userId: 'bot-id' });
	});

	it('should keep the current post-as user when username is not provided', async () => {
		await updateIncomingIntegration('user-id', 'integration-id', { channel: '#general' });

		expect(usersFindOneByUsername.calledOnceWithExactly('bot', { projection: { _id: 1, username: 1 } })).to.equal(true);
		expect(integrationsFindOneAndUpdate.firstCall.args[1].$set).to.not.have.any.keys('username', 'userId');
	});

	it('should reject a post-as user that was not found', async () => {
		usersFindOneByUsername.resolves(null);

		await expect(updateIncomingIntegration('user-id', 'integration-id', { channel: '#general' })).to.be.rejectedWith(
			ClientSafeError,
			'[error-invalid-post-as-user]',
		);
	});

	it('should reject a post-as user without message-impersonate', async () => {
		permissions['bot-id'] = [];

		await expect(updateIncomingIntegration('user-id', 'integration-id', { channel: '#general' })).to.be.rejectedWith(
			ClientSafeError,
			'[error-user-lacks-message-impersonate-permission]',
		);
		expect(hasPermissionAsync.lastCall.args).to.deep.equal(['bot-id', 'message-impersonate']);
		expect(integrationsFindOneAndUpdate.called).to.equal(false);
	});

	it('should update every provided field, notify and return the updated integration', async () => {
		const result = await updateIncomingIntegration('user-id', 'integration-id', {
			channel: '#general',
			enabled: true,
			name: 'My hook',
			avatar: 'avatar-url',
			emoji: ':smile:',
			alias: 'Alias',
			username: 'bot',
			script: 'return 1;',
			scriptEnabled: false,
			scriptEngine: 'isolated-vm',
			overrideDestinationChannelEnabled: true,
		});

		expect(
			integrationsFindOneAndUpdate.calledOnceWithExactly(
				{ _id: 'integration-id' },
				{
					$set: {
						enabled: true,
						name: 'My hook',
						avatar: 'avatar-url',
						emoji: ':smile:',
						alias: 'Alias',
						channel: ['#general'],
						username: 'bot',
						userId: 'bot-id',
						script: 'return 1;',
						scriptEnabled: false,
						scriptEngine: 'isolated-vm',
						overrideDestinationChannelEnabled: true,
						_updatedAt: NOW,
						_updatedBy: updatedBy,
					},
				},
				{ returnDocument: 'after' },
			),
		).to.equal(true);
		expect(usersFindOne.calledWithExactly({ _id: 'user-id' }, { projection: { username: 1 } })).to.equal(true);
		expect(result).to.deep.equal({ _id: 'integration-id', updated: true });
		expect(notifyOnIntegrationChanged.calledOnceWithExactly({ _id: 'integration-id', updated: true })).to.equal(true);
	});

	it('should leave out optional fields that were not provided', async () => {
		await updateIncomingIntegration('user-id', 'integration-id', { channel: '#general', enabled: false, name: 'My hook' });

		expect(integrationsFindOneAndUpdate.firstCall.args[1].$set).to.deep.equal({
			enabled: false,
			name: 'My hook',
			channel: ['#general'],
			scriptEnabled: undefined,
			scriptEngine: 'isolated-vm',
			_updatedAt: NOW,
			_updatedBy: updatedBy,
		});
	});

	it('should not touch script fields when the engine is frozen', async () => {
		isScriptEngineFrozen.returns(true);

		await updateIncomingIntegration('user-id', 'integration-id', {
			channel: '#general',
			script: 'return 2;',
			scriptEnabled: true,
			scriptEngine: 'isolated-vm',
		});

		expect(integrationsFindOneAndUpdate.firstCall.args[1].$set).to.not.have.any.keys('script', 'scriptEnabled', 'scriptEngine');
	});

	it('should not notify when no integration was updated', async () => {
		integrationsFindOneAndUpdate.resolves(null);

		const result = await updateIncomingIntegration('user-id', 'integration-id', { channel: '#general' });

		expect(result).to.equal(null);
		expect(notifyOnIntegrationChanged.called).to.equal(false);
	});
});

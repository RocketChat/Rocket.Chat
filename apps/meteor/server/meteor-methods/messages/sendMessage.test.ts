import { afterEach, before, beforeEach, describe, it } from 'node:test';

import { ClientSafeError } from '@rocket.chat/core-services';
import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const settingsValues: Record<string, unknown> = {};
const broadcast = sinon.stub();
const canSendMessageAsync = sinon.stub();
const sendMessage = sinon.stub();
const messagesSentInc = sinon.stub();
const messagesSentTotalInc = sinon.stub();
const systemLoggerError = sinon.stub();
const translate = sinon.stub();

const usersFindOneById = sinon.stub();
const messagesFindOneById = sinon.stub();

const { executeSendMessage } = proxyquire.noCallThru().load('./sendMessage', {
	'@rocket.chat/core-services': { api: { broadcast }, ClientSafeError },
	'../../lib/authorization/canSendMessage': { canSendMessageAsync },
	'../../lib/i18n': { i18n: { t: translate } },
	'../../lib/logger/system': { SystemLogger: { error: systemLoggerError } },
	'../../lib/messages/sendMessage': { sendMessage },
	'../../lib/metrics': { metrics: { messagesSent: { inc: messagesSentInc }, messagesSentTotal: { inc: messagesSentTotalInc } } },
	'../../settings': { settings: { get: (key: string) => settingsValues[key] } },
});

const NOW = new Date('2026-01-01T12:00:00.000Z');
const user = { _id: 'user-id', username: 'john', language: 'pt-BR' };
const room = { _id: 'room-id', t: 'c' };

describe('executeSendMessage', () => {
	let clock: sinon.SinonFakeTimers;

	before(() => {
		mockModel('Users', { findOneById: usersFindOneById });
		mockModel('Messages', { findOneById: messagesFindOneById });
	});

	beforeEach(() => {
		clock = sinon.useFakeTimers({ now: NOW, toFake: ['Date'] });
		Object.assign(settingsValues, {
			Threads_enabled: true,
			Message_MaxAllowedSize: 10,
			E2E_Enable: false,
			E2E_Allow_Unencrypted_Messages: false,
		});
		broadcast.reset();
		canSendMessageAsync.reset();
		canSendMessageAsync.resolves(room);
		sendMessage.reset();
		sendMessage.resolves({ _id: 'sent-message' });
		messagesSentInc.reset();
		messagesSentTotalInc.reset();
		systemLoggerError.reset();
		translate.reset();
		translate.callsFake((key: string) => `translated:${key}`);
		usersFindOneById.reset();
		usersFindOneById.resolves(user);
		messagesFindOneById.reset();
	});

	afterEach(() => {
		clock.restore();
	});

	it('should reject tshow without tmid before loading the user', async () => {
		await expect(executeSendMessage(user, { rid: 'room-id', tshow: true })).to.be.rejectedWith(ClientSafeError, '[invalid-params]');
		expect(usersFindOneById.called).to.equal(false);
		expect(sendMessage.called).to.equal(false);
	});

	it('should reject a thread message when threads are disabled', async () => {
		settingsValues.Threads_enabled = false;

		await expect(executeSendMessage(user, { rid: 'room-id', tmid: 'parent' })).to.be.rejectedWith(ClientSafeError, '[error-not-allowed]');
		expect(messagesFindOneById.called).to.equal(false);
	});

	it('should use the server time when neither the message nor extraInfo carries a ts', async () => {
		const message = { rid: 'room-id', msg: 'hi' };

		await executeSendMessage(user, message);

		expect(sendMessage.firstCall.args[1].ts).to.deep.equal(NOW);
	});

	it('should use extraInfo.ts without validating its distance from the server time', async () => {
		const extraTs = new Date('2020-01-01T00:00:00.000Z');
		const message = { rid: 'room-id', msg: 'hi', ts: new Date('2019-01-01T00:00:00.000Z') };

		await executeSendMessage(user, message, { ts: extraTs });

		expect(sendMessage.firstCall.args[1].ts).to.equal(extraTs);
	});

	it('should keep a client ts within 10 seconds of the server time', async () => {
		const clientTs = new Date(NOW.getTime() - 10000);

		await executeSendMessage(user, { rid: 'room-id', msg: 'hi', ts: clientTs });

		expect(sendMessage.firstCall.args[1].ts).to.equal(clientTs);
	});

	it('should replace a client ts between 10 and 60 seconds off with the server time', async () => {
		await executeSendMessage(user, { rid: 'room-id', msg: 'hi', ts: new Date(NOW.getTime() + 60000) });

		expect(sendMessage.firstCall.args[1].ts).to.deep.equal(NOW);
	});

	it('should reject a client ts more than 60 seconds in the past', async () => {
		const clientTs = new Date(NOW.getTime() - 60001);

		const error = await executeSendMessage(user, { rid: 'room-id', msg: 'hi', ts: clientTs }).catch((e: unknown) => e);

		expect(error).to.be.instanceOf(ClientSafeError);
		expect(error).to.include({ error: 'error-message-ts-out-of-sync', reason: 'Message timestamp is out of sync' });
		expect(error.details).to.deep.equal({ method: 'sendMessage', message_ts: clientTs, server_ts: NOW.getTime() });
		expect(usersFindOneById.called).to.equal(false);
	});

	it('should reject a client ts more than 60 seconds in the future', async () => {
		await expect(executeSendMessage(user, { rid: 'room-id', msg: 'hi', ts: new Date(NOW.getTime() + 60001) })).to.be.rejectedWith(
			ClientSafeError,
			'[error-message-ts-out-of-sync]',
		);
	});

	it('should accept a message as long as Message_MaxAllowedSize', async () => {
		await executeSendMessage(user, { rid: 'room-id', msg: '0123456789' });

		expect(sendMessage.calledOnce).to.equal(true);
	});

	it('should reject a message longer than Message_MaxAllowedSize', async () => {
		await expect(executeSendMessage(user, { rid: 'room-id', msg: '01234567890' })).to.be.rejectedWith(
			ClientSafeError,
			'[error-message-size-exceeded]',
		);
		expect(usersFindOneById.called).to.equal(false);
	});

	it('should treat a missing Message_MaxAllowedSize as zero', async () => {
		settingsValues.Message_MaxAllowedSize = undefined;

		await expect(executeSendMessage(user, { rid: 'room-id', msg: 'a' })).to.be.rejectedWith(
			ClientSafeError,
			'[error-message-size-exceeded]',
		);
	});

	it('should load the user when given a user id', async () => {
		await executeSendMessage('user-id', { rid: 'room-id', msg: 'hi' });

		expect(usersFindOneById.calledOnceWithExactly('user-id')).to.equal(true);
		expect(sendMessage.firstCall.args[0]).to.equal(user);
	});

	it('should not load the user when given a user object', async () => {
		await executeSendMessage(user, { rid: 'room-id', msg: 'hi' });

		expect(usersFindOneById.called).to.equal(false);
	});

	it('should reject a user that was not found', async () => {
		usersFindOneById.resolves(null);

		await expect(executeSendMessage('user-id', { rid: 'room-id', msg: 'hi' })).to.be.rejectedWith(ClientSafeError, '[error-invalid-user]');
	});

	it('should reject a user without username', async () => {
		await expect(executeSendMessage({ _id: 'user-id' }, { rid: 'room-id', msg: 'hi' })).to.be.rejectedWith(
			ClientSafeError,
			'[error-invalid-user]',
		);
	});

	it('should attach a reply to a nested thread to the root thread and the parent room', async () => {
		messagesFindOneById.resolves({ rid: 'parent-room', tmid: 'root' });
		const message = { rid: 'room-id', msg: 'hi', tmid: 'parent' };

		await executeSendMessage(user, message);

		expect(messagesFindOneById.calledOnceWithExactly('parent', { projection: { rid: 1, tmid: 1 } })).to.equal(true);
		expect(message.tmid).to.equal('root');
		expect(canSendMessageAsync.calledOnceWithExactly('parent-room', user)).to.equal(true);
		expect(message.rid).to.equal('room-id');
	});

	it('should keep tmid and rid when the parent message is not found', async () => {
		messagesFindOneById.resolves(null);
		const message = { rid: 'room-id', msg: 'hi', tmid: 'parent' };

		await executeSendMessage(user, message);

		expect(message.tmid).to.equal('parent');
		expect(canSendMessageAsync.calledOnceWithExactly('room-id', user)).to.equal(true);
	});

	it('should use the parent room as rid when the message has none', async () => {
		messagesFindOneById.resolves({ rid: 'parent-room' });

		await executeSendMessage(user, { rid: '', msg: 'hi', tmid: 'parent' });

		expect(canSendMessageAsync.calledOnceWithExactly('parent-room', user)).to.equal(true);
	});

	it('should throw a plain error when there is no rid', async () => {
		const error = await executeSendMessage(user, { rid: '', msg: 'hi' }).catch((e: unknown) => e);

		expect(error).to.be.instanceOf(Error).and.not.instanceOf(ClientSafeError);
		expect(error.message).to.equal("The 'rid' property on the message object is missing.");
		expect(canSendMessageAsync.called).to.equal(false);
		expect(broadcast.called).to.equal(false);
	});

	it('should send the message, count it and return the result', async () => {
		const message = { rid: 'room-id', msg: 'hi' };

		const result = await executeSendMessage(user, message, { previewUrls: ['https://a.b'] });

		expect(result).to.deep.equal({ _id: 'sent-message' });
		expect(sendMessage.calledOnceWithExactly(user, message, room, { previewUrls: ['https://a.b'] })).to.equal(true);
		expect(messagesSentInc.calledOnce).to.equal(true);
		expect(messagesSentTotalInc.calledOnce).to.equal(true);
		expect(broadcast.called).to.equal(false);
	});

	it('should pass undefined previewUrls when there is no extraInfo', async () => {
		await executeSendMessage(user, { rid: 'room-id', msg: 'hi' });

		expect(sendMessage.firstCall.args[3]).to.deep.equal({ previewUrls: undefined });
	});

	it('should reject an unencrypted message in an encrypted room when E2E forbids it', async () => {
		canSendMessageAsync.resolves({ ...room, encrypted: true });
		settingsValues.E2E_Enable = true;

		await expect(executeSendMessage(user, { rid: 'room-id', msg: 'hi' })).to.be.rejectedWith(ClientSafeError, '[error-not-allowed]');
		expect(sendMessage.called).to.equal(false);
		expect(messagesSentInc.called).to.equal(false);
		expect(systemLoggerError.calledOnce).to.equal(true);
		expect(translate.calledOnceWithExactly('error-not-allowed', { method: 'sendMessage', lng: 'pt-BR' })).to.equal(true);
		expect(
			broadcast.calledOnceWithExactly('notify.ephemeralMessage', 'user-id', 'room-id', { msg: 'translated:error-not-allowed' }),
		).to.equal(true);
	});

	it('should send an e2e message in an encrypted room when E2E forbids unencrypted ones', async () => {
		canSendMessageAsync.resolves({ ...room, encrypted: true });
		settingsValues.E2E_Enable = true;

		await executeSendMessage(user, { rid: 'room-id', msg: 'hi', t: 'e2e' });

		expect(sendMessage.calledOnce).to.equal(true);
	});

	it('should send an unencrypted message in an encrypted room when E2E allows it', async () => {
		canSendMessageAsync.resolves({ ...room, encrypted: true });
		settingsValues.E2E_Enable = true;
		settingsValues.E2E_Allow_Unencrypted_Messages = true;

		await executeSendMessage(user, { rid: 'room-id', msg: 'hi' });

		expect(sendMessage.calledOnce).to.equal(true);
	});

	it('should send an unencrypted message in an encrypted room when E2E is disabled', async () => {
		canSendMessageAsync.resolves({ ...room, encrypted: true });

		await executeSendMessage(user, { rid: 'room-id', msg: 'hi' });

		expect(sendMessage.calledOnce).to.equal(true);
	});

	it('should notify the user with the original message rid and rethrow a string error as Error', async () => {
		messagesFindOneById.resolves({ rid: 'parent-room' });
		canSendMessageAsync.callsFake(() => Promise.reject('error-cannot-send'));

		const error = await executeSendMessage(user, { rid: 'room-id', msg: 'hi', tmid: 'parent' }).catch((e: unknown) => e);

		expect(error).to.be.instanceOf(Error);
		expect(error.message).to.equal('error-cannot-send');
		expect(systemLoggerError.calledOnceWithExactly({ msg: 'Error sending message:', err: 'error-cannot-send' })).to.equal(true);
		expect(translate.calledOnceWithExactly('error-cannot-send', { lng: 'pt-BR' })).to.equal(true);
		expect(
			broadcast.calledOnceWithExactly('notify.ephemeralMessage', 'user-id', 'room-id', { msg: 'translated:error-cannot-send' }),
		).to.equal(true);
	});

	it('should translate the error code with its details and rethrow the same error', async () => {
		const thrown = new ClientSafeError('error-action-not-allowed', 'Not allowed', { action: 'send' });
		sendMessage.rejects(thrown);

		const error = await executeSendMessage(user, { rid: 'room-id', msg: 'hi' }).catch((e: unknown) => e);

		expect(error).to.equal(thrown);
		expect(translate.calledOnceWithExactly('error-action-not-allowed', { action: 'send', lng: 'pt-BR' })).to.equal(true);
		expect(messagesSentInc.called).to.equal(false);
	});

	it('should translate the error message when the error has no code', async () => {
		const thrown = new Error('something broke');
		sendMessage.rejects(thrown);

		await expect(executeSendMessage(user, { rid: 'room-id', msg: 'hi' })).to.be.rejectedWith(thrown);
		expect(translate.calledOnceWithExactly('something broke', { lng: 'pt-BR' })).to.equal(true);
	});
});

import { after, before, beforeEach, describe, it } from 'node:test';

import { LocalBroker, ServiceClass, api } from '@rocket.chat/core-services';
import type { IAuthorization } from '@rocket.chat/core-services';
import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import { canAccessRoomAsync } from '../authorization/canAccessRoom';

const sandbox = sinon.createSandbox();

const hasPermission = sandbox.stub();
const canAccessRoom = sandbox.stub();
const findUserByEmail = sandbox.stub();
const findMessage = sandbox.stub();
const findRoom = sandbox.stub();
const findSubscription = sandbox.stub();
const sendMessage = sandbox.stub();
const beforeSendMessageToRoom = sandbox.stub();
const settingValues: Record<string, unknown> = {};

class AuthorizationDouble extends ServiceClass implements Pick<IAuthorization, 'hasPermission' | 'canAccessRoom'> {
	protected name = 'authorization';

	async hasPermission(...args: Parameters<IAuthorization['hasPermission']>) {
		return hasPermission(...args);
	}

	async canAccessRoom(...args: Parameters<IAuthorization['canAccessRoom']>) {
		return canAccessRoom(...args);
	}
}

const authorization = new AuthorizationDouble();

const { processDirectEmail } = proxyquire.noCallThru().load('./processDirectEmail', {
	'../../hooks/rooms/beforeSendMessageToRoom': { beforeSendMessageToRoom },
	'../../settings': { settings: { get: (id: string) => settingValues[id] } },
	'../authorization': { canAccessRoomAsync },
	'../messages/sendMessage': { sendMessage },
	'../metrics': { metrics: { messagesSent: { inc: sandbox.stub() }, messagesSentTotal: { inc: sandbox.stub() } } },
});

const mid = 'message-id';
const rid = 'room-id';
const replier = { _id: 'replier-id', username: 'replier', name: 'Replier' };
const room = { _id: rid, t: 'c' };

const replyEmail = (overrides: Record<string, unknown> = {}) => ({
	date: new Date(),
	html: '<p>Thanks</p>',
	text: 'Thanks',
	to: { text: `reply+${mid}@example.com` },
	from: { value: [{ address: 'replier@example.com' }] },
	...overrides,
});

const postedMessage = () => {
	expect(sendMessage.calledOnce, 'sendMessage was not called once').to.be.true;
	return sendMessage.firstCall.args[1];
};

describe('processDirectEmail', () => {
	before(() => {
		api.setBroker(new LocalBroker());
		api.registerService(authorization);
		mockModel('Users', { findOneByEmailAddress: findUserByEmail });
		mockModel('Messages', { findOneById: findMessage });
		mockModel('Rooms', { findOneById: findRoom });
		mockModel('Subscriptions', { findOneByRoomIdAndUserId: findSubscription });
	});

	after(() => api.destroyService(authorization));

	beforeEach(() => {
		sandbox.reset();
		settingValues.Message_MaxAllowedSize = 5000;
		findUserByEmail.resolves(replier);
		findMessage.resolves({ _id: mid, rid, u: { _id: 'author-id', username: 'author' } });
		findRoom.resolves(room);
		canAccessRoom.resolves(true);
	});

	it('should post the reply in the thread of the replied message, mentioning its author', async () => {
		const email = replyEmail();

		await processDirectEmail(email);

		expect(sendMessage.calledOnce).to.be.true;
		expect(sendMessage.firstCall.args).to.deep.equal([
			replier,
			{ ts: email.date, msg: '@author Thanks', sentByEmail: true, groupable: false, tmid: mid, rid },
			room,
		]);
	});

	it('should not mention the author again when the reply already does', async () => {
		await processDirectEmail(replyEmail({ text: 'Thanks @author' }));

		expect(postedMessage().msg).to.equal('Thanks @author');
	});

	it('should not mention the author in a direct message', async () => {
		findRoom.resolves({ ...room, t: 'd' });

		await processDirectEmail(replyEmail());

		expect(postedMessage().msg).to.equal('Thanks');
	});

	it('should join paragraphs with single line breaks', async () => {
		await processDirectEmail(replyEmail({ text: 'First\n\nSecond' }));

		expect(postedMessage().msg).to.equal('@author First\nSecond');
	});

	it('should use the current time when the email date is not recent', async () => {
		const before = Date.now();

		await processDirectEmail(replyEmail({ date: new Date(before - 60_000) }));

		expect(postedMessage().ts.getTime()).to.be.at.least(before);
	});

	it('should post in a read-only room when the user has post-readonly', async () => {
		findRoom.resolves({ ...room, ro: true });
		hasPermission.withArgs(replier._id, 'post-readonly', rid).resolves(true);

		await processDirectEmail(replyEmail());

		postedMessage();
	});

	it('should post in a read-only room when the user was unmuted in it', async () => {
		findRoom.resolves({ ...room, ro: true, unmuted: [replier.username] });

		await processDirectEmail(replyEmail());

		postedMessage();
	});

	const withoutDate = () => {
		const { date: _date, ...email } = replyEmail();
		return email;
	};

	const dropped: [string, () => void, () => Record<string, unknown>][] = [
		['the email has no date', () => undefined, withoutDate],
		['the reply address has no message id', () => undefined, () => replyEmail({ to: { text: 'reply@example.com' } })],
		[
			'the reply is longer than Message_MaxAllowedSize',
			() => {
				settingValues.Message_MaxAllowedSize = 3;
			},
			replyEmail,
		],
		['no user has the sender address', () => findUserByEmail.resolves(null), replyEmail],
		['the sender has no username yet', () => findUserByEmail.resolves({ _id: replier._id }), replyEmail],
		['the replied message no longer exists', () => findMessage.resolves(null), replyEmail],
		['the room no longer exists', () => findRoom.resolves(null), replyEmail],
		['the user cannot access the room', () => canAccessRoom.resolves(false), replyEmail],
		['the user is blocked in the room', () => findSubscription.resolves({ rid, blocked: true }), replyEmail],
		['the user blocked the room', () => findSubscription.resolves({ rid, blocker: true }), replyEmail],
		['the user is muted in the room', () => findRoom.resolves({ ...room, muted: [replier.username] }), replyEmail],
		['the room is read-only for the user', () => findRoom.resolves({ ...room, ro: true }), replyEmail],
		['the room refuses new messages', () => beforeSendMessageToRoom.rejects(new Error('error-room-archived')), replyEmail],
	];

	for (const [condition, arrange, email] of dropped) {
		it(`should drop the reply when ${condition}`, async () => {
			arrange();

			await processDirectEmail(email());

			expect(sendMessage.called).to.be.false;
		});
	}
});

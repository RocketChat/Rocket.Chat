import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const message = {
	_id: 'msg1',
	rid: 'room1',
	msg: 'hello',
	u: { _id: 'author', username: 'author', name: 'Author' },
} as unknown as IMessage;

const room = { _id: 'room1', t: 'c' } as IRoom;
const reactor = { _id: 'reactor', username: 'reactor', name: 'Reactor' } as IUser;

describe('notifyAuthorOnReaction', () => {
	let notifyDesktopUserStub: sinon.SinonStub;
	let shouldNotifyDesktopStub: sinon.SinonStub;
	let usersFindOneByIdStub: sinon.SinonStub;
	let subsFindOneStub: sinon.SinonStub;
	let shortnameToUnicodeStub: sinon.SinonStub;
	let callbacksAddStub: sinon.SinonStub;
	let callbacksRemoveStub: sinon.SinonStub;
	let watchCallback: (enabled: boolean) => void;
	let notifyAuthorOnReaction: any;

	beforeEach(() => {
		notifyDesktopUserStub = sinon.stub().resolves();
		shouldNotifyDesktopStub = sinon.stub().returns(true);
		usersFindOneByIdStub = sinon.stub().resolves({ _id: 'author', status: 'online', statusConnection: 'online' });
		subsFindOneStub = sinon.stub().resolves({ desktopNotifications: 'all', disableNotifications: false });
		shortnameToUnicodeStub = sinon.stub().returnsArg(0);
		callbacksAddStub = sinon.stub();
		callbacksRemoveStub = sinon.stub();

		const watchStub = sinon.stub().callsFake((_key: string, fn: (enabled: boolean) => void) => {
			watchCallback = fn;
		});

		({ notifyAuthorOnReaction } = proxyquire.noPreserveCache().load('../../../../../server/hooks/messages/notifyAuthorOnReaction', {
			'@rocket.chat/models': {
				'Users': { findOneById: usersFindOneByIdStub },
				'Subscriptions': { findOneByRoomIdAndUserId: subsFindOneStub },
				'@noCallThru': true,
			},
			'../../../app/emoji-native/lib/shortnameToUnicode': {
				'shortnameToUnicode': shortnameToUnicodeStub,
				'@noCallThru': true,
			},
			'../../lib/callbacks': {
				'callbacks': { add: callbacksAddStub, remove: callbacksRemoveStub, priority: { LOW: 'low' } },
				'@noCallThru': true,
			},
			'../../lib/i18n': { 'i18n': { t: sinon.stub().returns('reacted') }, '@noCallThru': true },
			'../../lib/notifications/message/desktop': {
				'notifyDesktopUser': notifyDesktopUserStub,
				'shouldNotifyDesktop': shouldNotifyDesktopStub,
				'@noCallThru': true,
			},
			'../../settings': { 'settings': { watch: watchStub, get: sinon.stub().returns(true) }, '@noCallThru': true },
		}));
	});

	it('does not notify when user reacts to their own message', async () => {
		await notifyAuthorOnReaction(message, { user: { _id: 'author' } as IUser, reaction: ':smile:', room });
		expect(notifyDesktopUserStub.called).to.be.false;
	});

	it('does not notify when the author opted out via preference', async () => {
		usersFindOneByIdStub.resolves({
			_id: 'author',
			status: 'online',
			statusConnection: 'online',
			settings: { preferences: { receiveReactionNotifications: false } },
		});
		await notifyAuthorOnReaction(message, { user: reactor, reaction: ':smile:', room });
		expect(notifyDesktopUserStub.called).to.be.false;
	});

	it('does not notify when author has no subscription', async () => {
		subsFindOneStub.resolves(null);
		await notifyAuthorOnReaction(message, { user: reactor, reaction: ':smile:', room });
		expect(notifyDesktopUserStub.called).to.be.false;
	});

	it('does not notify when the author disabled notifications for the room', async () => {
		subsFindOneStub.resolves({ desktopNotifications: 'all', disableNotifications: true });
		await notifyAuthorOnReaction(message, { user: reactor, reaction: ':smile:', room });
		expect(notifyDesktopUserStub.called).to.be.false;
	});

	it('does not notify when desktop notifications are gated off', async () => {
		shouldNotifyDesktopStub.returns(false);
		await notifyAuthorOnReaction(message, { user: reactor, reaction: ':smile:', room });
		expect(notifyDesktopUserStub.called).to.be.false;
	});

	it('notifies the author with a resolved unicode body when another user reacts', async () => {
		await notifyAuthorOnReaction(message, { user: reactor, reaction: ':smile:', room });
		expect(notifyDesktopUserStub.calledOnce).to.be.true;
		expect(shortnameToUnicodeStub.calledWith(':smile:')).to.be.true;
		expect(notifyDesktopUserStub.firstCall.firstArg).to.include({ userId: 'author', notificationMessage: 'reacted' });
	});

	describe('global toggle', () => {
		it('registers the hook when Reaction_Notifications_Enabled is on', () => {
			watchCallback(true);
			expect(callbacksAddStub.calledWith('afterSetReaction', notifyAuthorOnReaction, 'low', 'notifyAuthorOnReaction')).to.be.true;
		});

		it('removes the hook when Reaction_Notifications_Enabled is off', () => {
			watchCallback(false);
			expect(callbacksRemoveStub.calledWith('afterSetReaction', 'notifyAuthorOnReaction')).to.be.true;
		});
	});
});

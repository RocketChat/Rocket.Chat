import { before, beforeEach, describe, it } from 'node:test';

import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import sinon from 'sinon';

import { loadWithMocks } from '../../../tests/mocks/utils/loadWithMocks';

const settingsValues: Record<string, unknown> = {};
const hasPermissionAsync = sinon.stub();
const parseMessageTextPerUser = sinon.stub();
const shouldNotifyDesktop = sinon.stub();
const notifyDesktopUser = sinon.stub();
const shouldNotifyMobile = sinon.stub();
const getPushData = sinon.stub();
const shouldNotifyEmail = sinon.stub();
const getEmailData = sinon.stub();
const messageContainsHighlight = sinon.stub();
const scheduleItem = sinon.stub();
const shortnameToUnicode = sinon.stub();

const usersFindOneById = sinon.stub();

const { sendNotification } = loadWithMocks('./sendNotificationsOnMessage', {
	'./notifyUsersOnMessage': { getMentions: sinon.stub() },
	'../../../lib/emoji-native/shortnameToUnicode': { shortnameToUnicode },
	'../../lib/authorization/hasPermission': { hasPermissionAsync },
	'../../lib/callbacks': { callbacks: {} },
	'../../lib/notifications/message': { parseMessageTextPerUser, replaceMentionedUsernamesWithFullNames: sinon.stub() },
	'../../lib/notifications/message/desktop': { notifyDesktopUser, shouldNotifyDesktop },
	'../../lib/notifications/message/email': { getEmailData, shouldNotifyEmail },
	'../../lib/notifications/message/messageContainsHighlight': { messageContainsHighlight },
	'../../lib/notifications/message/mobile': { getPushData, shouldNotifyMobile },
	'../../lib/notifications/queue/NotificationQueue': { Notification: { scheduleItem } },
	'../../lib/rooms/roomCoordinator': { roomCoordinator: {} },
	'../../settings': { settings: { get: (key: string) => settingsValues[key], watch: sinon.stub() } },
});

const sender = { _id: 'sender-id', name: 'Sender', username: 'sender' };
const room = { _id: 'room-id', t: 'c', uids: ['sender-id', 'receiver-id'] };
const receiver = {
	username: 'receiver',
	status: 'online',
	statusConnection: 'online',
	emails: [
		{ address: 'unverified@x.com', verified: false },
		{ address: 'first@x.com', verified: true },
		{ address: 'second@x.com', verified: true },
	],
	settings: { preferences: { enableMobileRinging: true } },
};

describe('sendNotification', () => {
	let subscription: any;
	let message: any;
	let params: any;

	before(() => {
		mockModel('Users', { findOneById: usersFindOneById });
	});

	beforeEach(() => {
		settingsValues.Troubleshoot_Disable_Notifications = false;
		hasPermissionAsync.reset();
		hasPermissionAsync.resolves(true);
		parseMessageTextPerUser.reset();
		parseMessageTextPerUser.resolves('parsed message');
		shouldNotifyDesktop.reset();
		shouldNotifyDesktop.returns(false);
		notifyDesktopUser.reset();
		shouldNotifyMobile.reset();
		shouldNotifyMobile.returns(false);
		getPushData.reset();
		getPushData.resolves({ push: true });
		shouldNotifyEmail.reset();
		shouldNotifyEmail.returns(false);
		getEmailData.reset();
		getEmailData.resolves({ email: true });
		messageContainsHighlight.reset();
		messageContainsHighlight.returns(false);
		scheduleItem.reset();
		shortnameToUnicode.reset();
		shortnameToUnicode.callsFake((text: string) => `unicode(${text})`);
		usersFindOneById.reset();

		subscription = {
			u: { _id: 'receiver-id' },
			rid: 'room-id',
			desktopNotifications: 'all',
			mobilePushNotifications: 'mentions',
			emailNotifications: 'nothing',
			userHighlights: ['word'],
			audioNotificationValue: 'beep',
			receiver: [receiver],
		};
		message = { _id: 'message-id', u: { _id: 'sender-id' }, msg: ':smile: hi', t: undefined, attachments: undefined };
		params = {
			subscription,
			sender,
			hasReplyToThread: false,
			hasMentionToAll: false,
			hasMentionToHere: false,
			message,
			notificationMessage: 'raw message',
			room,
			mentionIds: [],
			disableAllMessageNotifications: false,
		};
	});

	it('should do nothing when notifications are disabled by troubleshooting', async () => {
		settingsValues.Troubleshoot_Disable_Notifications = true;
		shouldNotifyDesktop.returns(true);

		await sendNotification(params);

		expect(parseMessageTextPerUser.called).to.equal(false);
		expect(notifyDesktopUser.called).to.equal(false);
		expect(scheduleItem.called).to.equal(false);
	});

	it('should not notify the sender', async () => {
		subscription.u._id = 'sender-id';
		shouldNotifyDesktop.returns(true);

		await sendNotification(params);

		expect(parseMessageTextPerUser.called).to.equal(false);
		expect(notifyDesktopUser.called).to.equal(false);
	});

	it('should not notify a user who muted group mentions for an @all mention', async () => {
		subscription.muteGroupMentions = true;
		delete subscription.receiver;

		await sendNotification({ ...params, hasMentionToAll: true });

		expect(usersFindOneById.called).to.equal(false);
		expect(parseMessageTextPerUser.called).to.equal(false);
	});

	it('should not notify a user who muted group mentions for an @here mention', async () => {
		subscription.muteGroupMentions = true;

		await sendNotification({ ...params, hasMentionToHere: true });

		expect(parseMessageTextPerUser.called).to.equal(false);
	});

	it('should notify a user who muted group mentions when also mentioned directly', async () => {
		subscription.muteGroupMentions = true;

		await sendNotification({ ...params, hasMentionToAll: true, mentionIds: ['receiver-id'] });

		expect(parseMessageTextPerUser.calledOnce).to.equal(true);
	});

	it('should notify a user who muted group mentions when it is a reply to their thread', async () => {
		subscription.muteGroupMentions = true;

		await sendNotification({ ...params, hasMentionToAll: true, hasReplyToThread: true });

		expect(parseMessageTextPerUser.calledOnce).to.equal(true);
	});

	it('should load the receiver when the subscription does not carry it', async () => {
		delete subscription.receiver;
		usersFindOneById.resolves(receiver);

		await sendNotification(params);

		expect(
			usersFindOneById.calledOnceWithExactly('receiver-id', {
				projection: {
					'active': 1,
					'emails': 1,
					'language': 1,
					'status': 1,
					'statusConnection': 1,
					'username': 1,
					'settings.preferences.enableMobileRinging': 1,
				},
			}),
		).to.equal(true);
		expect(subscription.receiver).to.deep.equal([receiver]);
		expect(parseMessageTextPerUser.calledOnceWithExactly('raw message', message, receiver)).to.equal(true);
	});

	it('should throw when the receiver is not found', async () => {
		delete subscription.receiver;
		usersFindOneById.resolves(null);

		await expect(sendNotification(params)).to.be.rejectedWith('receiver not found');
	});

	it('should not notify about a direct message a user lacks view-d-room permission for', async () => {
		hasPermissionAsync.resolves(false);
		shouldNotifyDesktop.returns(true);

		await sendNotification({ ...params, room: { ...room, t: 'd' } });

		expect(hasPermissionAsync.calledOnceWithExactly('receiver-id', 'view-d-room')).to.equal(true);
		expect(parseMessageTextPerUser.called).to.equal(false);
		expect(notifyDesktopUser.called).to.equal(false);
	});

	it('should not check view-d-room outside direct messages', async () => {
		await sendNotification(params);

		expect(hasPermissionAsync.called).to.equal(false);
	});

	it('should notify the desktop with the message parsed for the receiver', async () => {
		shouldNotifyDesktop.returns(true);
		messageContainsHighlight.returns(true);

		await sendNotification({ ...params, mentionIds: ['receiver-id'], hasMentionToHere: true });

		expect(messageContainsHighlight.calledOnceWithExactly(message, ['word'])).to.equal(true);
		expect(
			shouldNotifyDesktop.calledOnceWithExactly({
				disableAllMessageNotifications: false,
				status: 'online',
				statusConnection: 'online',
				desktopNotifications: 'all',
				hasMentionToAll: false,
				hasMentionToHere: true,
				isHighlighted: true,
				hasMentionToUser: true,
				hasReplyToThread: false,
				roomType: 'c',
				isThread: false,
			}),
		).to.equal(true);
		expect(
			notifyDesktopUser.calledOnceWithExactly({
				notificationMessage: 'parsed message',
				userId: 'receiver-id',
				user: sender,
				message,
				room,
				audioNotificationValue: 'beep',
			}),
		).to.equal(true);
		expect(scheduleItem.called).to.equal(false);
	});

	it('should treat a receiver without status as offline and a thread message as a thread', async () => {
		subscription.receiver = [{ username: 'receiver' }];
		message.tmid = 'thread-id';

		await sendNotification(params);

		expect(shouldNotifyDesktop.firstCall.args[0]).to.include({ status: 'offline', statusConnection: 'offline', isThread: true });
		expect(shouldNotifyMobile.firstCall.args[0]).to.include({ isThread: true });
		expect(shouldNotifyEmail.called).to.equal(false);
	});

	it('should not treat a thread message shown in the room as a thread', async () => {
		message.tmid = 'thread-id';
		message.tshow = true;

		await sendNotification(params);

		expect(shouldNotifyDesktop.firstCall.args[0]).to.include({ isThread: false });
	});

	it('should schedule a push notification', async () => {
		shouldNotifyMobile.returns(true);
		message.t = 'videoconf';

		await sendNotification(params);

		expect(
			shouldNotifyMobile.calledOnceWithExactly({
				disableAllMessageNotifications: false,
				mobilePushNotifications: 'mentions',
				hasMentionToAll: false,
				isHighlighted: false,
				hasMentionToUser: false,
				hasReplyToThread: false,
				roomType: 'c',
				isThread: false,
				isVideoConf: true,
				userPreferences: { enableMobileRinging: true },
				roomUids: ['sender-id', 'receiver-id'],
			}),
		).to.equal(true);
		expect(
			getPushData.calledOnceWithExactly({
				notificationMessage: 'parsed message',
				room,
				message,
				userId: 'receiver-id',
				senderUsername: 'sender',
				senderName: 'Sender',
				receiver,
			}),
		).to.equal(true);
		expect(
			scheduleItem.calledOnceWithExactly({
				user: receiver,
				uid: 'receiver-id',
				rid: 'room-id',
				mid: 'message-id',
				items: [{ type: 'push', data: { push: true } }],
			}),
		).to.equal(true);
	});

	it('should not check email preferences for a receiver without emails', async () => {
		subscription.receiver = [{ ...receiver, emails: undefined }];

		await sendNotification(params);

		expect(shouldNotifyEmail.called).to.equal(false);
	});

	it('should pass the email decision inputs to shouldNotifyEmail', async () => {
		await sendNotification({ ...params, hasReplyToThread: true, disableAllMessageNotifications: true });

		expect(
			shouldNotifyEmail.calledOnceWithExactly({
				disableAllMessageNotifications: true,
				statusConnection: 'online',
				emailNotifications: 'nothing',
				isHighlighted: false,
				hasMentionToUser: false,
				hasMentionToAll: false,
				hasReplyToThread: true,
				roomType: 'c',
				isThread: false,
			}),
		).to.equal(true);
		expect(getEmailData.called).to.equal(false);
		expect(scheduleItem.called).to.equal(false);
	});

	it('should schedule one email to the first verified address with emoji converted', async () => {
		shouldNotifyEmail.returns(true);

		await sendNotification({ ...params, mentionIds: ['receiver-id'] });

		expect(getEmailData.calledOnce).to.equal(true);
		expect(getEmailData.firstCall.args[0]).to.deep.equal({
			message: { ...message, msg: 'unicode(:smile: hi)' },
			receiver,
			sender,
			subscription,
			room,
			emailAddress: 'first@x.com',
			hasMentionToUser: true,
		});
		expect(
			scheduleItem.calledOnceWithExactly({
				user: receiver,
				uid: 'receiver-id',
				rid: 'room-id',
				mid: 'message-id',
				items: [{ type: 'email', data: { email: true } }],
			}),
		).to.equal(true);
	});

	it('should convert emoji in the first attachment only and keep the rest', async () => {
		shouldNotifyEmail.returns(true);
		message.attachments = [
			{ title: 'first', description: ':a:', text: ':b:' },
			{ title: 'second', description: ':c:', text: ':d:' },
		];

		await sendNotification(params);

		expect(getEmailData.firstCall.args[0].message.attachments).to.deep.equal([
			{ title: 'first', description: 'unicode(:a:)', text: 'unicode(:b:)' },
			{ title: 'second', description: ':c:', text: ':d:' },
		]);
	});

	it('should drop non-string description and text of the first attachment', async () => {
		shouldNotifyEmail.returns(true);
		message.attachments = [{ title: 'first' }];

		await sendNotification(params);

		expect(getEmailData.firstCall.args[0].message.attachments).to.deep.equal([{ title: 'first', description: undefined, text: undefined }]);
	});

	it('should keep an empty attachments list and an empty msg as they are', async () => {
		shouldNotifyEmail.returns(true);
		message.msg = '';
		message.attachments = [];

		await sendNotification(params);

		expect(getEmailData.firstCall.args[0].message).to.deep.equal(message);
		expect(shortnameToUnicode.called).to.equal(false);
	});

	it('should not schedule an email when no address is verified', async () => {
		shouldNotifyEmail.returns(true);
		subscription.receiver = [{ ...receiver, emails: [{ address: 'unverified@x.com', verified: false }] }];

		await sendNotification(params);

		expect(getEmailData.called).to.equal(false);
		expect(scheduleItem.called).to.equal(false);
	});

	it('should schedule push before email in a single queue entry', async () => {
		shouldNotifyMobile.returns(true);
		shouldNotifyEmail.returns(true);

		await sendNotification(params);

		expect(scheduleItem.calledOnce).to.equal(true);
		expect(scheduleItem.firstCall.args[0].items).to.deep.equal([
			{ type: 'push', data: { push: true } },
			{ type: 'email', data: { email: true } },
		]);
	});
});

/* eslint-disable @typescript-eslint/no-empty-function */
import { expect } from 'chai';
import { describe, it } from 'mocha';
import proxyquire from 'proxyquire';

const load = ({ isGroupChat = true } = {}) =>
	proxyquire.noCallThru().load('../../../../../../server/lib/notifications/message/email.js', {
		'@rocket.chat/tools': {
			escapeHTML: (str: string) => str,
		},
		'meteor/meteor': {
			Meteor: {
				startup: () => {},
				absoluteUrl: () => '',
			},
		},
		'../../callbacks': {
			callbacks: {
				run: () => {},
			},
		},
		'../../i18n': {
			i18n: {
				t: (trans: string) => trans,
			},
		},
		'../../rooms/roomCoordinator': {
			roomCoordinator: {
				getRoomDirectives: () => ({
					isGroupChat: () => isGroupChat,
				}),
				getRoomName: () => 'room',
				getRouteLink: () => '/group/room',
			},
		},
		'../email/api': {
			getTemplate: () => {},
			send: () => {},
			replace: (subjectKey: string) => subjectKey,
		},
		'../../../settings': {
			settings: {
				// Subject settings resolve to their own id so the test can tell which one was picked
				get: (id: string) => (id.startsWith('Offline_') && id.endsWith('_Email') ? id : false),
				watch: () => {},
			},
		},
		'../../metrics': {
			metrics: {},
		},
		'../../utils/getURL': {
			getURL: () => '',
		},
	});

const message = {
	_id: 'message-id',
	msg: 'hello',
	u: {
		_id: 'sender-id',
		name: 'rocket.cat',
		username: 'rocket.cat',
	},
};

const baseArgs = {
	receiver: { _id: 'receiver-id', username: 'receiver' },
	sender: { _id: 'sender-id', username: 'rocket.cat' },
	subscription: {},
	room: { _id: 'room-id', name: 'room', t: 'c' },
	emailAddress: 'receiver@example.com',
};

describe('getEmailData subject', () => {
	it('should use the mention subject when the receiver was mentioned', async () => {
		const { getEmailData } = load();

		const { subject } = await getEmailData({ ...baseArgs, message, isMentioned: true });
		expect(subject).to.be.equal('Offline_Mention_Email');
	});

	it('should use the message subject when the receiver was not mentioned', async () => {
		const { getEmailData } = load();

		const { subject } = await getEmailData({ ...baseArgs, message, isMentioned: false });
		expect(subject).to.be.equal('Offline_Mention_All_Email');
	});

	it('should use the thread subject for a thread follower who was not mentioned', async () => {
		const { getEmailData } = load();

		const { subject } = await getEmailData({ ...baseArgs, message: { ...message, tmid: 'thread-id' }, isMentioned: false });
		expect(subject).to.be.equal('Offline_Thread_Email');
	});

	it('should use the thread mention subject when the receiver was mentioned in a thread', async () => {
		const { getEmailData } = load();

		const { subject } = await getEmailData({ ...baseArgs, message: { ...message, tmid: 'thread-id' }, isMentioned: true });
		expect(subject).to.be.equal('Offline_Mention_Thread_Email');
	});

	it('should use the direct message subjects outside group chats', async () => {
		const { getEmailData } = load({ isGroupChat: false });

		const { subject: rootSubject } = await getEmailData({ ...baseArgs, message, isMentioned: false });
		const { subject: threadSubject } = await getEmailData({ ...baseArgs, message: { ...message, tmid: 'thread-id' }, isMentioned: false });

		expect(rootSubject).to.be.equal('Offline_DM_Email');
		expect(threadSubject).to.be.equal('Offline_DM_Thread_Email');
	});
});

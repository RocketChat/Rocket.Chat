/* eslint-disable @typescript-eslint/no-empty-function */
import { expect } from 'chai';
import { describe, it } from 'mocha';
import proxyquire from 'proxyquire';

const mocks = {
	'@rocket.chat/string-helpers': {
		escapeHTML: (str: string) => str,
	},
	'meteor/meteor': {
		Meteor: {
			startup: () => {},
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
				isGroupChat: () => true,
			}),
			getRoomName: () => '',
		},
	},
	'../email/api': {
		getTemplate: () => {},
		send: () => {},
		replace: () => {},
	},
	'../../../settings': {
		settings: {
			get: () => true,
			watch: () => {},
		},
	},
	'../../metrics': {
		metrics: {},
	},
	'../../utils/getURL': {
		getURL: () => {},
	},
};

const message = {
	u: {
		name: 'rocket.cat',
		username: 'rocket.cat',
	},
};

const room = {
	fname: 'room',
	name: 'room',
	t: 'p',
};

describe('getEmailContent', () => {
	it('should return preview string for encrypted message', async () => {
		const { getEmailContent } = proxyquire.noCallThru().load('../../../../../../server/lib/notifications/message/email.js', mocks);

		const result = await getEmailContent({
			message: { ...message, t: 'e2e' },
			user: undefined,
			room,
		});
		expect(result).to.be.equal('Encrypted_message_preview_unavailable');
	});

	it('should return header for encrypted message if Email_notification_show_message is turned off', async () => {
		const { getEmailContent } = proxyquire.noCallThru().load('../../../../../../server/lib/notifications/message/email.js', {
			...mocks,
			'../../../settings': {
				settings: {
					get: () => false,
					watch: () => {},
				},
			},
		});

		const result = await getEmailContent({
			message: { ...message, t: 'e2e' },
			user: undefined,
			room,
		});
		expect(result).to.be.equal('User_sent_a_message_on_channel');
	});
});

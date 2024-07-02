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
	'../../../../../lib/callbacks': {
		callbacks: {
			run: () => {},
		},
	},
	'../../../../../server/lib/i18n': {
		i18n: {
			t: (trans: string) => trans,
		},
	},
	'../../../../../server/lib/rooms/roomCoordinator': {
		roomCoordinator: {
			getRoomDirectives: () => ({
				isGroupChat: () => true,
			}),
			getRoomName: () => '',
		},
	},
	'../../../../mailer/server/api': {
		getTemplate: () => {},
		send: () => {},
		replace: () => {},
	},
	'../../../../settings/server': {
		settings: {
			get: () => true,
			watch: () => {},
		},
	},
	'../../../../metrics/server': {
		metrics: {},
	},
	'../../../../utils/server/getURL': {
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
		const { getEmailContent } = proxyquire.noCallThru().load('../../../../app/lib/server/functions/notifications/email.js', mocks);

		const result = await getEmailContent({
			message: { ...message, t: 'e2e' },
			user: undefined,
			room,
		});
		expect(result).to.be.equal('Encrypted_message_preview_unavailable');
	});

	it('should return header for encrypted message if Email_notification_show_message is turned off', async () => {
		const { getEmailContent } = proxyquire.noCallThru().load('../../../../app/lib/server/functions/notifications/email.js', {
			...mocks,
			'../../../../settings/server': {
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

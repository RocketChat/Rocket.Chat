/* oxlint-disable @typescript-eslint/no-empty-function */
import { describe, it, mock } from 'node:test';

import { expect } from 'chai';

const loadEmail = (settingsValue: boolean) => {
	const moduleMocks = [
		mock.module('@rocket.chat/tools', { exports: { escapeHTML: (str: string) => str } }),
		mock.module('../../callbacks', { exports: { callbacks: { run: () => {} } } }),
		mock.module('../../i18n', { exports: { i18n: { t: (trans: string) => trans } } }),
		mock.module('../../rooms/roomCoordinator', {
			exports: {
				roomCoordinator: {
					getRoomDirectives: () => ({
						isGroupChat: () => true,
					}),
					getRoomName: () => '',
				},
			},
		}),
		mock.module('../email/api', { exports: { getTemplate: () => {}, send: () => {}, replace: () => {} } }),
		mock.module('../../../settings', { exports: { settings: { get: () => settingsValue, watch: () => {} } } }),
		mock.module('../../metrics', { exports: { metrics: {} } }),
		mock.module('../../utils/getURL', { exports: { getURL: () => {} } }),
	];
	delete require.cache[require.resolve('./email.js')];
	// oxlint-disable-next-line @typescript-eslint/no-require-imports
	const email = require('./email.js');
	moduleMocks.forEach((moduleMock) => moduleMock.restore());
	return email;
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
		const { getEmailContent } = loadEmail(true);

		const result = await getEmailContent({
			message: { ...message, t: 'e2e' },
			user: undefined,
			room,
		});
		expect(result).to.be.equal('Encrypted_message_preview_unavailable');
	});

	it('should return header for encrypted message if Email_notification_show_message is turned off', async () => {
		const { getEmailContent } = loadEmail(false);

		const result = await getEmailContent({
			message: { ...message, t: 'e2e' },
			user: undefined,
			room,
		});
		expect(result).to.be.equal('User_sent_a_message_on_channel');
	});
});

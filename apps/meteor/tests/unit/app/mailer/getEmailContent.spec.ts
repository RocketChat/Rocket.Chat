/* eslint-disable @typescript-eslint/no-empty-function */
import { expect } from 'chai';
import { describe, it, vi } from 'vitest';

// The second test previously re-`proxyquire`d the subject with a different `settings.get`. With
// `vi.mock` the module loads once, so the settings stub reads a mutable flag we flip per test.
const { settingsGetResult } = vi.hoisted(() => ({ settingsGetResult: { value: true } }));

vi.mock('@rocket.chat/string-helpers', () => ({
	escapeHTML: (str: string) => str,
}));
vi.mock('meteor/meteor', () => ({
	Meteor: {
		startup: () => {},
	},
}));
vi.mock('../../../../server/lib/callbacks', () => ({
	callbacks: {
		run: () => {},
	},
}));
vi.mock('../../../../server/lib/i18n', () => ({
	i18n: {
		t: (trans: string) => trans,
	},
}));
vi.mock('../../../../server/lib/rooms/roomCoordinator', () => ({
	roomCoordinator: {
		getRoomDirectives: () => ({
			isGroupChat: () => true,
		}),
		getRoomName: () => '',
	},
}));
vi.mock('../../../../app/mailer/server/api', () => ({
	getTemplate: () => {},
	send: () => {},
	replace: () => {},
}));
vi.mock('../../../../app/settings/server', () => ({
	settings: {
		get: () => settingsGetResult.value,
		watch: () => {},
	},
}));
vi.mock('../../../../app/metrics/server', () => ({
	metrics: {},
}));
vi.mock('../../../../app/utils/server/getURL', () => ({
	getURL: () => {},
}));

const { getEmailContent } = await import('../../../../app/lib/server/functions/notifications/email.js');

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
		settingsGetResult.value = true;

		const result = await getEmailContent({
			message: { ...message, t: 'e2e' },
			user: undefined,
			room,
		});
		expect(result).to.be.equal('Encrypted_message_preview_unavailable');
	});

	it('should return header for encrypted message if Email_notification_show_message is turned off', async () => {
		settingsGetResult.value = false;

		const result = await getEmailContent({
			message: { ...message, t: 'e2e' },
			user: undefined,
			room,
		});
		expect(result).to.be.equal('User_sent_a_message_on_channel');
	});
});

import { MeteorError } from '@rocket.chat/core-services';

import { sendUserEmail, sendWelcomeEmail, sendPasswordEmail } from './sendUserEmail';
import * as Mailer from '../../../../mailer/server/api';
import { settings } from '../../../../settings/server';

const userData = {
	email: 'test@example.com',
	password: '123456',
	name: 'Test User',
};

jest.mock('meteor/meteor', () => ({
	Meteor: {
		startup: jest.fn(),
	},
}));

jest.mock('../../../../mailer/server/api', () => ({
	getTemplate: jest.fn(),
	send: jest.fn(),
}));

jest.mock('../../../../settings/server', () => ({
	settings: {
		get: jest.fn((key: string) => {
			if (key === 'From_Email') return 'no-reply@example.com';
			if (key === 'Accounts_UserAddedEmail_Subject') return 'Welcome [name]!';
			if (key === 'Password_Changed_Email_Subject') return 'Password Changed';
			return '';
		}),
	},
}));

beforeEach(() => {
	jest.clearAllMocks();
});

describe('sendUserEmail', () => {
	it('should not send email if userData.email is missing', async () => {
		await sendUserEmail('subject', '<p>html</p>', { ...userData, email: undefined });

		expect(Mailer.send).not.toHaveBeenCalled();
	});

	it('should send email with correct parameters', async () => {
		await sendUserEmail('subject', '<p>html</p>', userData);

		expect(Mailer.send).toHaveBeenCalledWith(
			expect.objectContaining({
				to: userData.email,
				from: settings.get('From_Email'),
				subject: 'subject',
				html: '<p>html</p>',
				data: expect.objectContaining({
					email: userData.email,
					password: userData.password,
					name: userData.name,
				}),
			}),
		);
	});

	it('should throw MeteorError if Mailer.send fails', async () => {
		(Mailer.send as jest.Mock).mockImplementationOnce(() => {
			throw new Error('fail');
		});

		await expect(sendUserEmail('subject', '<p>html</p>', userData)).rejects.toThrow(MeteorError);
	});
});

describe('sendWelcomeEmail', () => {
	it('should call sendUserEmail with welcome subject and template', async () => {
		await sendWelcomeEmail(userData);

		expect(Mailer.send).toHaveBeenCalledWith(
			expect.objectContaining({
				subject: `Welcome [name]!`,
				to: userData.email,
				data: {
					email: userData.email,
					password: userData.password,
					name: userData.name,
				},
			}),
		);
	});
});

describe('sendPasswordEmail', () => {
	it('should call sendUserEmail with password subject and template', async () => {
		await sendPasswordEmail(userData);

		expect(Mailer.send).toHaveBeenCalledWith(
			expect.objectContaining({
				subject: 'Password Changed',
				to: userData.email,
			}),
		);
	});
});

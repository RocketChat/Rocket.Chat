import { MeteorError } from '@rocket.chat/core-services';
import { expect } from 'chai';
import Sinon from 'sinon';
import { describe, it, beforeEach, afterEach, vi } from 'vitest';

type SendUserEmailFn = (subject: string, html: string, user: { email?: string; password?: string; name?: string }) => Promise<void>;
type SendHelperFn = (user: { email?: string; password?: string; name?: string }) => Promise<void>;

const userData = {
	email: 'test@example.com',
	password: '123456',
	name: 'Test User',
};

// proxyquire previously rebuilt fresh stubs and re-`load`ed the module each test. With vi.mock we
// mock once, then in `beforeEach` reset the stubs through the hoisted sandbox and re-apply default
// behaviours.
const { sandbox, MailerStub, SettingsStub, MeteorStub } = vi.hoisted(() => {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const sinon = require('sinon');
	const sandbox = sinon.createSandbox();
	return {
		sandbox,
		MailerStub: {
			getTemplate: sandbox.stub(),
			send: sandbox.stub(),
		},
		SettingsStub: {
			settings: {
				get: sandbox.stub(),
			},
		},
		MeteorStub: {
			Meteor: {
				startup: sandbox.stub(),
			},
		},
	};
});

vi.mock('../../../../../../app/mailer/server/api', () => MailerStub);
vi.mock('../../../../../../app/settings/server', () => SettingsStub);
vi.mock('meteor/meteor', () => MeteorStub);

const { sendUserEmail, sendWelcomeEmail, sendPasswordEmail } = (await import(
	'../../../../../../app/lib/server/functions/saveUser/sendUserEmail'
)) as {
	sendUserEmail: SendUserEmailFn;
	sendWelcomeEmail: SendHelperFn;
	sendPasswordEmail: SendHelperFn;
};

describe('sendUserEmail (Mocha + TS)', () => {
	beforeEach(() => {
		sandbox.reset();
		SettingsStub.settings.get.callsFake((key: string) => {
			if (key === 'From_Email') return 'no-reply@example.com';
			if (key === 'Accounts_UserAddedEmail_Subject') return 'Welcome [name]!';
			if (key === 'Password_Changed_Email_Subject') return 'Password Changed';
			return '';
		});
	});

	afterEach(() => {
		sandbox.reset();
	});

	describe('sendUserEmail', () => {
		it('should not send email if userData.email is missing', async () => {
			await sendUserEmail('subject', '<p>html</p>', { ...userData, email: undefined });

			Sinon.assert.notCalled(MailerStub.send);
		});

		it('should send email with correct parameters', async () => {
			await sendUserEmail('subject', '<p>html</p>', userData);

			Sinon.assert.calledOnce(MailerStub.send);
			const callArg = MailerStub.send.getCall(0).args[0];
			expect(callArg).to.be.an('object');
			expect(callArg).to.include({
				to: userData.email,
				from: SettingsStub.settings.get('From_Email'),
				subject: 'subject',
				html: '<p>html</p>',
			});
			expect(callArg.data).to.include({
				email: userData.email,
				password: userData.password,
				name: userData.name,
			});
		});

		it('should throw MeteorError if Mailer.send fails', async () => {
			MailerStub.send.throws(new Error('fail'));

			let thrown = false;
			try {
				await sendUserEmail('subject', '<p>html</p>', userData);
			} catch (err) {
				thrown = true;
				expect(err).to.be.instanceOf(MeteorError);
			}
			expect(thrown).to.equal(true);
		});

		it('should mask password in email data if password is not provided', async () => {
			await sendUserEmail('subject', '<p>html</p>', { ...userData, password: undefined });

			Sinon.assert.calledOnce(MailerStub.send);
			const callArg = MailerStub.send.getCall(0).args[0];
			expect(callArg.data).to.include({
				email: userData.email,
				password: '******',
				name: userData.name,
			});
		});
	});

	describe('sendWelcomeEmail', () => {
		it('should call sendUserEmail with welcome subject and template', async () => {
			await sendWelcomeEmail(userData);

			Sinon.assert.calledOnce(MailerStub.send);
			const callArg = MailerStub.send.getCall(0).args[0];
			expect(callArg).to.include({
				subject: `Welcome [name]!`,
				to: userData.email,
			});
			expect(callArg.data).to.deep.equal({
				email: userData.email,
				password: userData.password,
				name: userData.name,
			});
		});
	});

	describe('sendPasswordEmail', () => {
		it('should call sendUserEmail with password subject and template', async () => {
			await sendPasswordEmail(userData);

			Sinon.assert.calledOnce(MailerStub.send);
			const callArg = MailerStub.send.getCall(0).args[0];
			expect(callArg).to.include({
				subject: 'Password Changed',
				to: userData.email,
			});
		});
	});
});

import { MeteorError } from '@rocket.chat/core-services';
import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import mock from 'proxyquire';
import Sinon from 'sinon';

type SendUserEmailFn = (subject: string, html: string, user: { email?: string; password?: string; name?: string }) => Promise<void>;
type SendHelperFn = (user: { email?: string; password?: string; name?: string }) => Promise<void>;

const userData = {
	email: 'test@example.com',
	password: '123456',
	name: 'Test User',
};

const makeStubs = () => {
	const MailerStub = {
		getTemplate: Sinon.stub(),
		send: Sinon.stub(),
	};

	const SettingsStub = {
		settings: {
			get: Sinon.stub().callsFake((key: string) => {
				if (key === 'From_Email') return 'no-reply@example.com';
				if (key === 'Accounts_UserAddedEmail_Subject') return 'Welcome [name]!';
				if (key === 'Password_Changed_Email_Subject') return 'Password Changed';
				return '';
			}),
		},
	};

	const MeteorStub = {
		Meteor: {
			startup: Sinon.stub(),
		},
	};

	return { MailerStub, SettingsStub, MeteorStub };
};

describe('sendUserEmail (Mocha + TS)', () => {
	let MailerStub: { getTemplate: Sinon.SinonStub; send: Sinon.SinonStub };
	let SettingsStub: { settings: { get: Sinon.SinonStub } };
	let MeteorStub: { Meteor: { startup: Sinon.SinonStub } };

	let sendUserEmail: SendUserEmailFn;
	let sendWelcomeEmail: SendHelperFn;
	let sendPasswordEmail: SendHelperFn;

	beforeEach(() => {
		const stubs = makeStubs();
		MailerStub = stubs.MailerStub as any;
		SettingsStub = stubs.SettingsStub as any;
		MeteorStub = stubs.MeteorStub as any;

		const mod = mock.noCallThru().load('./../../../../../../../meteor/app/lib/server/functions/saveUser/sendUserEmail.ts', {
			'../../../../mailer/server/api': MailerStub,
			'../../../../settings/server': SettingsStub,
			'meteor/meteor': MeteorStub,
		}) as any;

		sendUserEmail = mod.sendUserEmail as SendUserEmailFn;
		sendWelcomeEmail = mod.sendWelcomeEmail as SendHelperFn;
		sendPasswordEmail = mod.sendPasswordEmail as SendHelperFn;
	});

	afterEach(() => {
		Sinon.restore();
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

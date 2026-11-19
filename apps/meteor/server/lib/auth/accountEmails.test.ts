import { before, beforeEach, describe, it } from 'node:test';

import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const findOneById = sinon.stub();
const setPasswordResetToken = sinon.stub().resolves();
const setPasswordEnrollToken = sinon.stub().resolves();
const addEmailVerificationToken = sinon.stub().resolves();
const sendNoWrap = sinon.stub().resolves();

const templates: Record<string, string> = {
	Forgot_Password_Email: 'Hi [name], reset at [Forgot_Password_Url]',
	Accounts_Enrollment_Email: 'Welcome [name] ([email])',
	Verification_Email: 'Hi [name], verify at [Verification_Url]',
};
const settingValues: Record<string, string> = {
	Site_Name: 'Rocket',
	From_Email: 'no-reply@example.com',
	Forgot_Password_Email_Subject: 'Reset for [name]',
	Accounts_Enrollment_Email_Subject: 'Account for [username]',
	Verification_Email_Subject: 'Verify your email',
};

const replace = (str: string, data: Record<string, unknown> = {}) =>
	str.replace(/\[(\w+)\]/g, (match, key) => (key in data ? String(data[key]) : match));

const { sendResetPasswordEmail, sendEnrollmentEmail, sendVerificationEmail } = proxyquire.noCallThru().load('./accountEmails', {
	'../notifications/email/api': {
		getTemplateWrapped: (template: string, fn: (html: string) => void) => fn(templates[template]),
		replace,
		replacekey: (str: string, key: string, value: string) => str.replace(`[${key}]`, value),
		sendNoWrap,
	},
	'../../settings': { settings: { get: (id: string) => settingValues[id] } },
	'../i18n': { i18n: { t: (key: string) => key } },
	'../utils/getURL': { getWorkspaceURL: (path: string) => `https://chat.example.com/${path}` },
});

const user = {
	_id: 'user-id',
	name: 'Jane',
	username: 'jane',
	emails: [
		{ address: 'jane@example.com', verified: true },
		{ address: 'jane@work.example.com', verified: false },
	],
};

describe('accountEmails', () => {
	before(() => {
		mockModel('Users', { findOneById, setPasswordResetToken, setPasswordEnrollToken, addEmailVerificationToken });
	});

	beforeEach(() => {
		findOneById.reset();
		findOneById.resolves(user);
		setPasswordResetToken.resetHistory();
		setPasswordEnrollToken.resetHistory();
		addEmailVerificationToken.resetHistory();
		sendNoWrap.resetHistory();
	});

	describe('sendResetPasswordEmail', () => {
		it('should store a reset token and email its link to the given address', async () => {
			await sendResetPasswordEmail('user-id', 'jane@work.example.com');

			sinon.assert.calledOnce(setPasswordResetToken);
			const [userId, tokenRecord] = setPasswordResetToken.firstCall.args;
			expect(userId).to.equal('user-id');
			expect(tokenRecord).to.include({ email: 'jane@work.example.com', reason: 'reset' });
			expect(tokenRecord.token).to.match(/^[A-Za-z0-9_-]{43}$/);
			expect(tokenRecord.when).to.be.instanceOf(Date);

			sinon.assert.calledOnceWithExactly(sendNoWrap, {
				to: 'jane@work.example.com',
				from: 'Rocket <no-reply@example.com>',
				subject: 'Reset for Jane',
				html: `Hi Jane, reset at https://chat.example.com/reset-password/${tokenRecord.token}`,
			});
		});

		it("should default to the user's first address", async () => {
			await sendResetPasswordEmail('user-id');

			expect(setPasswordResetToken.firstCall.args[1].email).to.equal('jane@example.com');
			expect(sendNoWrap.firstCall.args[0].to).to.equal('jane@example.com');
		});

		it('should neither store a token nor send email for an address the user does not have', async () => {
			await expect(sendResetPasswordEmail('user-id', 'someone@else.com')).to.be.rejectedWith('No such email for user.');

			sinon.assert.notCalled(setPasswordResetToken);
			sinon.assert.notCalled(sendNoWrap);
		});

		it('should reject for an unknown user', async () => {
			findOneById.resolves(null);

			await expect(sendResetPasswordEmail('missing')).to.be.rejectedWith("Can't find user");
			sinon.assert.notCalled(sendNoWrap);
		});
	});

	describe('sendEnrollmentEmail', () => {
		it('should store an enrollment token, not a reset token, and email the user', async () => {
			await sendEnrollmentEmail('user-id');

			sinon.assert.notCalled(setPasswordResetToken);
			sinon.assert.calledOnce(setPasswordEnrollToken);
			expect(setPasswordEnrollToken.firstCall.args[1]).to.include({ email: 'jane@example.com', reason: 'enroll' });

			sinon.assert.calledOnceWithExactly(sendNoWrap, {
				to: 'jane@example.com',
				from: 'Rocket <no-reply@example.com>',
				subject: 'Account for jane',
				html: 'Welcome Jane (jane@example.com)',
			});
		});
	});

	describe('sendVerificationEmail', () => {
		it("should add a verification token for the user's first unverified address and email its link", async () => {
			await sendVerificationEmail('user-id');

			sinon.assert.calledOnce(addEmailVerificationToken);
			const [userId, tokenRecord] = addEmailVerificationToken.firstCall.args;
			expect(userId).to.equal('user-id');
			expect(tokenRecord.address).to.equal('jane@work.example.com');
			expect(tokenRecord.token).to.match(/^[A-Za-z0-9_-]{43}$/);

			sinon.assert.calledOnceWithExactly(sendNoWrap, {
				to: 'jane@work.example.com',
				from: 'Rocket <no-reply@example.com>',
				subject: 'Verify your email',
				html: `Hi Jane, verify at https://chat.example.com/#/verify-email/${tokenRecord.token}`,
			});
		});

		it('should reject when every address is already verified', async () => {
			findOneById.resolves({ ...user, emails: [{ address: 'jane@example.com', verified: true }] });

			await expect(sendVerificationEmail('user-id')).to.be.rejectedWith('That user has no unverified email addresses.');
			sinon.assert.notCalled(addEmailVerificationToken);
		});

		it('should reject an address the user does not have', async () => {
			await expect(sendVerificationEmail('user-id', 'someone@else.com')).to.be.rejectedWith('No such email for user.');
			sinon.assert.notCalled(addEmailVerificationToken);
		});
	});
});

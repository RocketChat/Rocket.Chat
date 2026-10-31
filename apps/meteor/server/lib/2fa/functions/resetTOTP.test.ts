import { before, beforeEach, describe, it } from 'node:test';

import type { ClientSafeError } from '@rocket.chat/core-services';
import type { IUsersModel } from '@rocket.chat/model-typings';
import { registerModel } from '@rocket.chat/models';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const settingsGet = sinon.stub();
const isUserIdFederated = sinon.stub();
const sendEmail = sinon.stub();
const getFixedT = sinon.stub();
const notifyOnUserChange = sinon.stub();

const findOneById = sinon.stub();
const resetTOTPById = sinon.stub();
const unsetLoginTokens = sinon.stub();

const { resetTOTP } = proxyquire.noCallThru().load('./resetTOTP', {
	'../../../settings': { settings: { get: settingsGet } },
	'../../i18n': { i18n: { getFixedT } },
	'../../isUserIdFederated': { isUserIdFederated },
	'../../notifications/email/api': { send: sendEmail },
	'../../notifyListener': { notifyOnUserChange },
});

const userWithVerifiedEmail = {
	language: 'pt-BR',
	emails: [
		{ address: 'verified@company.com', verified: true },
		{ address: 'unverified@company.com', verified: false },
	],
};

describe('resetTOTP', () => {
	before(() => {
		registerModel('IUsersModel', { findOneById, resetTOTPById, unsetLoginTokens } as unknown as IUsersModel);
	});

	beforeEach(() => {
		for (const stub of [
			settingsGet,
			isUserIdFederated,
			sendEmail,
			getFixedT,
			notifyOnUserChange,
			findOneById,
			resetTOTPById,
			unsetLoginTokens,
		]) {
			stub.reset();
		}
		isUserIdFederated.resolves(false);
		sendEmail.resolves();
		getFixedT.returns((key: string) => key);
		findOneById.resolves(userWithVerifiedEmail);
		resetTOTPById.resolves({ modifiedCount: 1 });
		unsetLoginTokens.resolves();
	});

	describe('resetting', () => {
		it('should end the sessions of the user and report the reset', async () => {
			expect(await resetTOTP('user-id')).to.be.true;
			expect(unsetLoginTokens.calledOnceWith('user-id')).to.be.true;
			expect(notifyOnUserChange.calledOnce).to.be.true;
			expect(notifyOnUserChange.firstCall.args[0]).to.deep.equal({
				clientAction: 'updated',
				id: 'user-id',
				diff: { 'services.resume.loginTokens': [] },
			});
		});

		it('should keep the sessions and report no reset when the user had nothing to reset', async () => {
			resetTOTPById.resolves({ modifiedCount: 0 });

			expect(await resetTOTP('user-id')).to.be.false;
			expect(unsetLoginTokens.called).to.be.false;
			expect(notifyOnUserChange.called).to.be.false;
		});

		it('should refuse a federated user and keep the sessions', async () => {
			isUserIdFederated.resolves(true);

			const error = await resetTOTP('user-id').catch((e: ClientSafeError) => e);

			expect(error).to.have.property('error', 'error-not-allowed');
			expect(resetTOTPById.called).to.be.false;
			expect(unsetLoginTokens.called).to.be.false;
		});

		it('should not send an email when the caller does not ask for it', async () => {
			await resetTOTP('user-id');

			expect(sendEmail.called).to.be.false;
		});
	});

	describe('notifying the user', () => {
		it('should email only the verified addresses, in the language of the user', async () => {
			await resetTOTP('user-id', true);

			expect(sendEmail.calledOnce).to.be.true;
			expect(sendEmail.firstCall.args[0]).to.have.property('to', 'verified@company.com');
			expect(getFixedT.calledOnceWith('pt-BR')).to.be.true;
		});

		it('should tell the user what happened and warn about the old authenticator key', async () => {
			settingsGet.withArgs('From_Email').returns('noreply@company.com');

			await resetTOTP('user-id', true);

			const { from, subject, text, html } = sendEmail.firstCall.args[0];
			expect(from).to.equal('noreply@company.com');
			expect(subject).to.equal('TOTP_reset_email');
			for (const body of [text, html]) {
				expect(body).to.include('Your_TOTP_has_been_reset');
				expect(body).to.include('TOTP_Reset_Other_Key_Warning');
			}
		});

		it('should use the server language for a user with none', async () => {
			settingsGet.withArgs('Language').returns('de');
			findOneById.resolves({ emails: userWithVerifiedEmail.emails });

			await resetTOTP('user-id', true);

			expect(getFixedT.calledOnceWith('de')).to.be.true;
		});

		it('should use English when neither the user nor the server has a language', async () => {
			findOneById.resolves({ emails: userWithVerifiedEmail.emails });

			await resetTOTP('user-id', true);

			expect(getFixedT.calledOnceWith('en')).to.be.true;
		});

		it('should still reset for a user with no verified address', async () => {
			findOneById.resolves({ emails: [{ address: 'unverified@company.com', verified: false }] });

			expect(await resetTOTP('user-id', true)).to.be.true;
			expect(sendEmail.called).to.be.false;
		});

		it('should refuse an id with no user and reset nothing', async () => {
			findOneById.resolves(null);

			const error = await resetTOTP('unknown-id', true).catch((e: ClientSafeError) => e);

			expect(error).to.have.property('error', 'invalid-user');
			expect(resetTOTPById.called).to.be.false;
		});

		it('should leave two-factor authentication in place when the email cannot be sent', async () => {
			sendEmail.rejects(new Error('SMTP unavailable'));

			const error = await resetTOTP('user-id', true).catch((e: ClientSafeError) => e);

			expect(error).to.have.property('error', 'error-email-send-failed');
			expect(resetTOTPById.called).to.be.false;
			expect(unsetLoginTokens.called).to.be.false;
		});

		it('should email a federated user that the reset happened even though it is refused', async () => {
			isUserIdFederated.resolves(true);

			await resetTOTP('user-id', true).catch((e: ClientSafeError) => e);

			expect(sendEmail.calledOnce).to.be.true;
			expect(resetTOTPById.called).to.be.false;
		});

		it('should email a user that the reset happened even when there was nothing to reset', async () => {
			resetTOTPById.resolves({ modifiedCount: 0 });

			expect(await resetTOTP('user-id', true)).to.be.false;
			expect(sendEmail.calledOnce).to.be.true;
		});
	});
});

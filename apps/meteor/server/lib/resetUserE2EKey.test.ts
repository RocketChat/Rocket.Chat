import { beforeEach, describe, it } from 'node:test';

import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

class MeteorErrorMock extends Error {
	error: string;

	details: unknown;

	constructor(error: string, reason?: string, details?: unknown) {
		super(reason ?? error);
		this.error = error;
		this.details = details;
	}
}

const sandbox = sinon.createSandbox();

const broadcast = sandbox.stub();
const Users = { findOneById: sandbox.stub(), resetE2EKey: sandbox.stub(), unsetLoginTokens: sandbox.stub() };
const Subscriptions = { resetUserE2EKey: sandbox.stub() };
const Rooms = { removeUserFromE2EEQueue: sandbox.stub() };
const isUserIdFederated = sandbox.stub();
const sendEmail = sandbox.stub();
const notifyOnUserChange = sandbox.stub();
const notifyOnSubscriptionChangedByUserId = sandbox.stub();
const settingsGet = sandbox.stub();
const getFixedT = sandbox.stub();

const { resetUserE2EEncriptionKey } = proxyquire.noCallThru().load('./resetUserE2EKey', {
	'@rocket.chat/core-services': { api: { broadcast } },
	'@rocket.chat/models': { Users, Subscriptions, Rooms },
	'meteor/meteor': { Meteor: { Error: MeteorErrorMock } },
	'./i18n': { i18n: { getFixedT } },
	'./isUserIdFederated': { isUserIdFederated },
	'./notifications/email/api': { send: sendEmail },
	'./notifyListener': { notifyOnUserChange, notifyOnSubscriptionChangedByUserId },
	'../settings': { settings: { get: settingsGet } },
});

const UID = 'user-id';

const userWith = (fields: Record<string, unknown> = {}) => ({
	_id: UID,
	emails: [{ address: 'alice@example.com', verified: true }],
	...fields,
});

const expectNoKeyOrSessionCleanup = () => {
	expect(broadcast.called).to.be.equal(false);
	expect(Users.resetE2EKey.called).to.be.equal(false);
	expect(Subscriptions.resetUserE2EKey.called).to.be.equal(false);
	expect(Rooms.removeUserFromE2EEQueue.called).to.be.equal(false);
	expect(Users.unsetLoginTokens.called).to.be.equal(false);
	expect(notifyOnUserChange.called).to.be.equal(false);
};

describe('resetUserE2EEncriptionKey', () => {
	beforeEach(() => {
		sandbox.reset();

		broadcast.resolves();
		Users.findOneById.resolves(userWith());
		Users.resetE2EKey.resolves({ modifiedCount: 1 });
		Users.unsetLoginTokens.resolves({ modifiedCount: 1 });
		Subscriptions.resetUserE2EKey.resolves({ modifiedCount: 0 });
		Rooms.removeUserFromE2EEQueue.resolves({ modifiedCount: 0 });
		isUserIdFederated.resolves(false);
		sendEmail.resolves();
		settingsGet.withArgs('From_Email').returns('no-reply@example.com');
		getFixedT.callsFake((language: string) => (key: string) => `${language}:${key}`);
	});

	describe('key and session cleanup', () => {
		it('should force the live sessions out before resetting the user, subscription and room-queue keys', async () => {
			const result = await resetUserE2EEncriptionKey(UID, false);

			expect(result).to.be.equal(true);
			expect(broadcast.calledOnceWithExactly('user.forceLogout', UID)).to.be.equal(true);
			expect(Users.resetE2EKey.calledOnceWithExactly(UID)).to.be.equal(true);
			expect(Subscriptions.resetUserE2EKey.calledOnceWithExactly(UID)).to.be.equal(true);
			expect(Rooms.removeUserFromE2EEQueue.calledOnceWithExactly(UID)).to.be.equal(true);
			sinon.assert.callOrder(broadcast, Users.resetE2EKey);
			sinon.assert.callOrder(broadcast, Subscriptions.resetUserE2EKey);
			sinon.assert.callOrder(broadcast, Rooms.removeUserFromE2EEQueue);
		});

		it('should clear the login tokens after the keys are reset and announce the emptied resume tokens', async () => {
			await resetUserE2EEncriptionKey(UID, false);

			expect(Users.unsetLoginTokens.calledOnceWithExactly(UID)).to.be.equal(true);
			sinon.assert.callOrder(Users.resetE2EKey, Users.unsetLoginTokens);
			sinon.assert.callOrder(Subscriptions.resetUserE2EKey, Users.unsetLoginTokens);
			sinon.assert.callOrder(Rooms.removeUserFromE2EEQueue, Users.unsetLoginTokens);
			expect(
				notifyOnUserChange.calledOnceWithExactly({ clientAction: 'updated', id: UID, diff: { 'services.resume.loginTokens': [] } }),
			).to.be.equal(true);
			sinon.assert.callOrder(Users.unsetLoginTokens, notifyOnUserChange);
		});

		it('should announce the subscription change when subscription keys were reset', async () => {
			Subscriptions.resetUserE2EKey.resolves({ modifiedCount: 3 });

			await resetUserE2EEncriptionKey(UID, false);

			expect(notifyOnSubscriptionChangedByUserId.calledOnceWithExactly(UID)).to.be.equal(true);
		});

		it('should not announce a subscription change when no subscription key was reset', async () => {
			Subscriptions.resetUserE2EKey.resolves({ modifiedCount: 0 });
			await resetUserE2EEncriptionKey(UID, false);

			Subscriptions.resetUserE2EKey.resolves(null);
			await resetUserE2EEncriptionKey(UID, false);

			expect(notifyOnSubscriptionChangedByUserId.called).to.be.equal(false);
		});
	});

	describe('reset notification', () => {
		it('should not look the user up or send an email when the user is not to be notified', async () => {
			await resetUserE2EEncriptionKey(UID, false);

			expect(Users.findOneById.called).to.be.equal(false);
			expect(sendEmail.called).to.be.equal(false);
		});

		it('should email only the verified addresses, from the configured sender', async () => {
			Users.findOneById.resolves(
				userWith({
					language: 'pt-BR',
					emails: [
						{ address: 'first@example.com', verified: true },
						{ address: 'unverified@example.com', verified: false },
						{ address: 'second@example.com', verified: true },
					],
				}),
			);

			const result = await resetUserE2EEncriptionKey(UID, true);

			expect(result).to.be.equal(true);
			expect(sendEmail.args.map(([email]) => email.to)).to.deep.equal(['first@example.com', 'second@example.com']);
			const [email] = sendEmail.firstCall.args;
			expect(email.from).to.be.equal('no-reply@example.com');
			expect(email.subject).to.be.equal('pt-BR:E2E_key_reset_email');
			expect(email.text).to.include('pt-BR:Your_e2e_key_has_been_reset').and.include('pt-BR:E2E_Reset_Email_Content');
			expect(email.html).to.include('<p>pt-BR:Your_e2e_key_has_been_reset</p>').and.include('<p>pt-BR:E2E_Reset_Email_Content</p>');
		});

		it('should still reset the keys when the user has no verified email address', async () => {
			Users.findOneById.resolves(userWith({ emails: [{ address: 'unverified@example.com', verified: false }] }));
			expect(await resetUserE2EEncriptionKey(UID, true)).to.be.equal(true);

			Users.findOneById.resolves(userWith({ emails: undefined }));
			expect(await resetUserE2EEncriptionKey(UID, true)).to.be.equal(true);

			expect(sendEmail.called).to.be.equal(false);
			expect(Users.resetE2EKey.calledTwice).to.be.equal(true);
			expect(Users.unsetLoginTokens.calledTwice).to.be.equal(true);
		});

		it("should write the email in the user's language, else the workspace language, else English", async () => {
			settingsGet.withArgs('Language').returns('de');

			Users.findOneById.resolves(userWith({ language: 'pt-BR' }));
			await resetUserE2EEncriptionKey(UID, true);
			Users.findOneById.resolves(userWith());
			await resetUserE2EEncriptionKey(UID, true);
			settingsGet.withArgs('Language').returns('');
			await resetUserE2EEncriptionKey(UID, true);

			expect(getFixedT.args.map(([language]) => language)).to.deep.equal(['pt-BR', 'de', 'en']);
		});
	});

	describe('rejections and failures', () => {
		it('should reject a notified reset when the user does not exist', async () => {
			Users.findOneById.resolves(null);

			await expect(resetUserE2EEncriptionKey(UID, true))
				.to.be.rejectedWith(MeteorErrorMock)
				.and.eventually.have.property('error', 'invalid-user');
			expect(sendEmail.called).to.be.equal(false);
			expectNoKeyOrSessionCleanup();
		});

		it('should reject a federated user before forcing a logout or resetting keys', async () => {
			isUserIdFederated.resolves(true);

			await expect(resetUserE2EEncriptionKey(UID, false))
				.to.be.rejectedWith(MeteorErrorMock)
				.and.eventually.have.property('error', 'error-not-allowed');
			expect(isUserIdFederated.calledOnceWithExactly(UID)).to.be.equal(true);
			expectNoKeyOrSessionCleanup();
		});

		it('should report a failed email as error-email-send-failed and leave keys and sessions untouched', async () => {
			sendEmail.rejects(new Error('SMTP connection refused'));

			const error = await resetUserE2EEncriptionKey(UID, true).catch((e: MeteorErrorMock) => e);

			expect(error).to.be.instanceOf(MeteorErrorMock);
			expect(error.error).to.be.equal('error-email-send-failed');
			expect(error.message).to.be.equal('Error trying to send email: SMTP connection refused');
			expect(error.details).to.deep.equal({ function: 'resetUserE2EEncriptionKey', message: 'SMTP connection refused' });
			expectNoKeyOrSessionCleanup();
		});

		it('should stop at the first failed address without emailing the rest', async () => {
			Users.findOneById.resolves(
				userWith({
					emails: [
						{ address: 'first@example.com', verified: true },
						{ address: 'second@example.com', verified: true },
						{ address: 'third@example.com', verified: true },
					],
				}),
			);
			sendEmail.onSecondCall().callsFake(() => Promise.reject('mailbox full'));

			const error = await resetUserE2EEncriptionKey(UID, true).catch((e: MeteorErrorMock) => e);

			expect(error.message).to.be.equal('Error trying to send email: mailbox full');
			expect(error.details).to.deep.equal({ function: 'resetUserE2EEncriptionKey', message: 'mailbox full' });
			expect(sendEmail.callCount).to.be.equal(2);
			expectNoKeyOrSessionCleanup();
		});

		it('should propagate a failed logout without resetting keys or reporting success', async () => {
			broadcast.rejects(new Error('broker unavailable'));

			await expect(resetUserE2EEncriptionKey(UID, false)).to.be.rejectedWith('broker unavailable');
			expect(Users.resetE2EKey.called).to.be.equal(false);
			expect(Users.unsetLoginTokens.called).to.be.equal(false);
			expect(notifyOnUserChange.called).to.be.equal(false);
		});

		it('should propagate a failed key reset without clearing the sessions or reporting success', async () => {
			Users.resetE2EKey.rejects(new Error('write conflict'));

			await expect(resetUserE2EEncriptionKey(UID, false)).to.be.rejectedWith('write conflict');
			expect(Users.unsetLoginTokens.called).to.be.equal(false);
			expect(notifyOnUserChange.called).to.be.equal(false);
			expect(notifyOnSubscriptionChangedByUserId.called).to.be.equal(false);
		});
	});
});

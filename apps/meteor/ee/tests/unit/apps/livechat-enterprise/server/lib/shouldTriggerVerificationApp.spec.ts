import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const modelsMock = {
	LivechatContacts: {
		findOneById: sinon.stub(),
	},
};

const settingsMock = {
	get: sinon.stub(),
};

const { runShouldTriggerVerificationApp } = proxyquire.noCallThru().load('../../../../../../server/patches/shouldTriggerVerificationApp', {
	'@rocket.chat/models': modelsMock,
	'../../../app/settings/server': {
		settings: settingsMock,
	},
});

describe('shouldTriggerVerificationApp', () => {
	beforeEach(() => {
		modelsMock.LivechatContacts.findOneById.reset();
		settingsMock.get.reset();
	});

	afterEach(() => {
		sinon.restore();
	});

	it('should not trigger a verification app if the contact is not found', async () => {
		modelsMock.LivechatContacts.findOneById.resolves(undefined);

		const result = await runShouldTriggerVerificationApp(() => undefined, 'visitorId', 'contactId', {});
		expect(
			modelsMock.LivechatContacts.findOneById.calledOnceWith('contactId', sinon.match({ projection: { _id: 1, unknown: 1, channels: 1 } })),
		).to.be.true;
		expect(result).to.be.false;
	});

	it('should not trigger a verification app if there is no configured app', async () => {
		modelsMock.LivechatContacts.findOneById.resolves({ _id: 'contactId' });
		settingsMock.get.returns('');

		const result = await runShouldTriggerVerificationApp(() => undefined, 'visitorId', 'contactId', {});
		expect(result).to.be.false;
		expect(settingsMock.get.calledOnceWith('Livechat_Contact_Verification_App')).to.be.true;
	});

	it('should not trigger a verification app if the Livechat_Require_Contact_Verification is never', async () => {
		modelsMock.LivechatContacts.findOneById.resolves({ _id: 'contactId' });
		settingsMock.get.withArgs('Livechat_Contact_Verification_App').returns('verificationApp');
		settingsMock.get.withArgs('Livechat_Require_Contact_Verification').returns('never');

		const result = await runShouldTriggerVerificationApp(() => undefined, 'visitorId', 'contactId', 'other');
		expect(result).to.be.false;
	});

	it('should trigger a verification app if there is no verified contact and Livechat_Require_Contact_Verification is once', async () => {
		modelsMock.LivechatContacts.findOneById.resolves({ _id: 'contactId' });
		settingsMock.get.withArgs('Livechat_Contact_Verification_App').returns('verificationApp');
		settingsMock.get.withArgs('Livechat_Require_Contact_Verification').returns('once');

		const result = await runShouldTriggerVerificationApp(() => undefined, 'visitorId', 'contactId', 'other');
		expect(result).to.be.true;
	});

	it('should trigger a verification app if there is a verified contact and Livechat_Require_Contact_Verification is always', async () => {
		modelsMock.LivechatContacts.findOneById.resolves({
			_id: 'contactId',
			channels: [{ verified: true, visitor: { source: { visitorId: 'visitorId', type: 'other' } } }],
		});
		settingsMock.get.withArgs('Livechat_Contact_Verification_App').returns('verificationApp');
		settingsMock.get.withArgs('Livechat_Require_Contact_Verification').returns('always');

		const result = await runShouldTriggerVerificationApp(() => undefined, 'visitorId', 'contactId', { type: 'other' });
		expect(result).to.be.true;
	});
});

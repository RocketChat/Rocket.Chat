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

const { runIsAgentAvailableToTakeContactInquiry } = proxyquire
	.noCallThru()
	.load('../../../../../../server/patches/isAgentAvailableToTakeContactInquiry', {
		'@rocket.chat/models': modelsMock,
		'../../../app/settings/server': {
			settings: settingsMock,
		},
	});

describe('isAgentAvailableToTakeContactInquiry', () => {
	beforeEach(() => {
		modelsMock.LivechatContacts.findOneById.reset();
		settingsMock.get.reset();
	});

	afterEach(() => {
		sinon.restore();
	});

	it('should return false if the contact is not found', async () => {
		modelsMock.LivechatContacts.findOneById.resolves(undefined);
		const { value, error } = await runIsAgentAvailableToTakeContactInquiry(() => undefined, 'visitorId', {}, 'rid');

		expect(value).to.be.false;
		expect(error).to.eq('error-invalid-contact');
		expect(
			modelsMock.LivechatContacts.findOneById.calledOnceWith('contactId', sinon.match({ projection: { _id: 1, unknown: 1, channels: 1 } })),
		);
	});

	it('should return false if the contact is unknown and Livechat_Block_Unknown_Contacts is true', async () => {
		modelsMock.LivechatContacts.findOneById.resolves({ unknown: true });
		settingsMock.get.withArgs('Livechat_Block_Unknown_Contacts').returns(true);
		const { value, error } = await runIsAgentAvailableToTakeContactInquiry(() => undefined, 'visitorId', {}, 'rid');
		expect(value).to.be.false;
		expect(error).to.eq('error-unknown-contact');
	});

	it('should return false if the contact is not verified and Livechat_Block_Unverified_Contacts is true', async () => {
		modelsMock.LivechatContacts.findOneById.resolves({
			unknown: false,
			channels: [
				{ verified: false, visitor: { source: { type: 'channelName' }, visitorId: 'visitorId' } },
				{ verified: true, visitor: { source: { type: 'othername' }, visitorId: 'visitorId' } },
			],
		});
		settingsMock.get.withArgs('Livechat_Block_Unknown_Contacts').returns(true);
		settingsMock.get.withArgs('Livechat_Block_Unverified_Contacts').returns(true);
		const { value, error } = await runIsAgentAvailableToTakeContactInquiry(() => undefined, 'visitorId', { type: 'channelName' }, 'rid');
		expect(value).to.be.false;
		expect(error).to.eq('error-unverified-contact');
	});

	it('should return true if the contact has the verified channel', async () => {
		modelsMock.LivechatContacts.findOneById.resolves({
			unknown: false,
			channels: [
				{ verified: true, visitor: { source: { type: 'channelName' }, visitorId: 'visitorId' } },
				{ verified: false, visitor: { source: { type: 'othername' }, visitorId: 'visitorId' } },
			],
		});
		settingsMock.get.withArgs('Livechat_Block_Unknown_Contacts').returns(true);
		settingsMock.get.withArgs('Livechat_Block_Unverified_Contacts').returns(true);
		const { value } = await runIsAgentAvailableToTakeContactInquiry(() => undefined, 'visitorId', { type: 'channelName' }, 'rid');
		expect(value).to.be.true;
	});
});

import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const modelsMock = {
	LivechatContacts: {
		findOneById: sinon.stub(),
	},
	LivechatRooms: {
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
		modelsMock.LivechatRooms.findOneById.reset();
		settingsMock.get.reset();
	});

	afterEach(() => {
		sinon.restore();
	});

	it('should return false if the room is not found', async () => {
		modelsMock.LivechatRooms.findOneById.resolves(undefined);
		const { value, error } = await runIsAgentAvailableToTakeContactInquiry(() => undefined, {}, 'rid');

		expect(value).to.be.false;
		expect(error).to.eq('error-invalid-room');
		expect(modelsMock.LivechatRooms.findOneById.calledOnceWith('rid', sinon.match({ projection: { v: 1 } })));
	});

	it("should return false if there is no contactId in the room's visitor", async () => {
		modelsMock.LivechatRooms.findOneById.resolves({ v: { contactId: undefined } });
		const { value, error } = await runIsAgentAvailableToTakeContactInquiry(() => undefined, {}, 'rid');
		expect(value).to.be.false;
		expect(error).to.eq('error-invalid-contact');
	});

	it('should return false if the contact is not found', async () => {
		modelsMock.LivechatRooms.findOneById.resolves({ v: { contactId: 'contactId' } });
		modelsMock.LivechatContacts.findOneById.resolves(undefined);
		const { value, error } = await runIsAgentAvailableToTakeContactInquiry(() => undefined, {}, 'rid');

		expect(value).to.be.false;
		expect(error).to.eq('error-invalid-contact');
		expect(
			modelsMock.LivechatContacts.findOneById.calledOnceWith('contactId', sinon.match({ projection: { _id: 1, unknown: 1, channels: 1 } })),
		);
	});

	it('should return false if the contact is unknown and Livechat_Block_Unknown_Contacts is true', async () => {
		modelsMock.LivechatRooms.findOneById.resolves({ v: { contactId: 'contactId' } });
		modelsMock.LivechatContacts.findOneById.resolves({ unknown: true });
		settingsMock.get.withArgs('Livechat_Block_Unknown_Contacts').returns(true);
		const { value, error } = await runIsAgentAvailableToTakeContactInquiry(() => undefined, {}, 'rid');
		expect(value).to.be.false;
		expect(error).to.eq('error-unknown-contact');
	});

	it('should return false if the contact is not verified and Livechat_Block_Unverified_Contacts is true', async () => {
		modelsMock.LivechatRooms.findOneById.resolves({ v: { contactId: 'contactId' } });
		modelsMock.LivechatContacts.findOneById.resolves({
			unknown: false,
			channels: [
				{ verified: false, name: 'channelName' },
				{ verified: true, name: 'othername' },
			],
		});
		settingsMock.get.withArgs('Livechat_Block_Unknown_Contacts').returns(true);
		settingsMock.get.withArgs('Livechat_Block_Unverified_Contacts').returns(true);
		const { value, error } = await runIsAgentAvailableToTakeContactInquiry(() => undefined, { type: 'channelName' }, 'rid');
		expect(value).to.be.false;
		expect(error).to.eq('error-unverified-contact');
	});

	it('should return true if the contact has the verified channel', async () => {
		modelsMock.LivechatRooms.findOneById.resolves({ v: { contactId: 'contactId' } });
		modelsMock.LivechatContacts.findOneById.resolves({
			unknown: false,
			channels: [
				{ verified: true, name: 'channelName' },
				{ verified: false, name: 'othername' },
			],
		});
		settingsMock.get.withArgs('Livechat_Block_Unknown_Contacts').returns(true);
		settingsMock.get.withArgs('Livechat_Block_Unverified_Contacts').returns(true);
		const { value } = await runIsAgentAvailableToTakeContactInquiry(() => undefined, { type: 'channelName' }, 'rid');
		expect(value).to.be.true;
	});
});

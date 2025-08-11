import type { ILivechatContact } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const modelsMock = {
	LivechatContacts: {
		findOneById: sinon.stub(),
		disableByContactId: sinon.stub(),
	},
};

const settingsMock = {
	get: sinon.stub(),
};

const { disableContactById } = proxyquire.noCallThru().load('./disableContact', {
	'@rocket.chat/models': modelsMock,
	'../../../../settings/server': settingsMock,
});

describe('disableContact', () => {
	beforeEach(() => {
		settingsMock.get.reset();
		modelsMock.LivechatContacts.findOneById.reset();
		modelsMock.LivechatContacts.disableByContactId.reset();
	});

	it('should disable the contact', async () => {
		settingsMock.get.withArgs('Omnichannel_enable_contact_removal').returns(true);
		modelsMock.LivechatContacts.findOneById.resolves({ _id: 'contactId' } as ILivechatContact);
		modelsMock.LivechatContacts.disableByContactId.resolves({ _id: 'contactId' } as ILivechatContact);

		await disableContactById('contactId');

		expect(modelsMock.LivechatContacts.findOneById.getCall(0).args[0]).to.be.equal('contactId');
		expect(modelsMock.LivechatContacts.disableByContactId.getCall(0).args[0]).to.be.equal('contactId');
	});

	it('should throw error if contact is not found', async () => {
		settingsMock.get.withArgs('Omnichannel_enable_contact_removal').returns(true);
		modelsMock.LivechatContacts.findOneById.resolves(null);
		await expect(disableContactById('contactId')).to.be.rejectedWith('error-contact-not-found');

		expect(modelsMock.LivechatContacts.findOneById.getCall(0).args[0]).to.be.equal('contactId');
		expect(modelsMock.LivechatContacts.disableByContactId.getCall(0)).to.be.null;
	});
});

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

const { disableContactById } = proxyquire.noCallThru().load('./disableContact', {
	'@rocket.chat/models': modelsMock,
});

describe('disableContact', () => {
	beforeEach(() => {
		modelsMock.LivechatContacts.findOneById.reset();
		modelsMock.LivechatContacts.disableByContactId.reset();
	});

	it('should disable the contact', async () => {
		modelsMock.LivechatContacts.findOneById.resolves({ _id: 'contactId' } as ILivechatContact);
		modelsMock.LivechatContacts.disableByContactId.resolves({ _id: 'contactId' } as ILivechatContact);

		await disableContactById('contactId');

		expect(modelsMock.LivechatContacts.findOneById.getCall(0).args[0]).to.be.equal('contactId');
		expect(modelsMock.LivechatContacts.disableByContactId.getCall(0).args[0]).to.be.equal('contactId');
	});

	it('should throw error if contact is not found', async () => {
		modelsMock.LivechatContacts.findOneById.resolves(null);
		await expect(disableContactById('contactId')).to.be.rejectedWith('error-contact-not-found');

		expect(modelsMock.LivechatContacts.findOneById.getCall(0).args[0]).to.be.equal('contactId');
		expect(modelsMock.LivechatContacts.disableByContactId.getCall(0)).to.be.null;
	});
});

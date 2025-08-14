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

const { disableContactById } = proxyquire.noCallThru().load('../../../../../../app/livechat/server/lib/contacts/disableContact.ts', {
	'@rocket.chat/models': modelsMock,
});

describe('disableContact', () => {
	beforeEach(() => {
		modelsMock.LivechatContacts.disableByContactId.reset();
	});

	it('should disable the contact', async () => {
		modelsMock.LivechatContacts.disableByContactId.resolves({ _id: 'contactId' } as ILivechatContact);

		await disableContactById('contactId');

		expect(modelsMock.LivechatContacts.disableByContactId.getCall(0).args[0]).to.be.equal('contactId');
	});

	it('should throw error if contact is not found', async () => {
		modelsMock.LivechatContacts.disableByContactId.resolves({ matchedCount: 0 });

		await expect(disableContactById('contactId')).to.be.rejectedWith('error-contact-not-found');

		expect(modelsMock.LivechatContacts.disableByContactId.getCall(0).args[0]).to.be.equal('contactId');
	});
});

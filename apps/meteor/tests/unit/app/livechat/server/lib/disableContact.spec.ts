import type { ILivechatContact } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const modelsMock = {
	LivechatContacts: {
		findOneById: sinon.stub(),
		disableByContactId: sinon.stub(),
	},
	LivechatVisitors: {
		disableById: sinon.stub(),
	},
};

const { disableContactById } = proxyquire.noCallThru().load('../../../../../../app/livechat/server/lib/contacts/disableContact.ts', {
	'@rocket.chat/models': modelsMock,
});

const contact = {
	_id: 'contactId',
	name: 'contactName',
	channels: [
		{
			visitor: {
				visitorId: 'visitorId',
			},
		},
	],
} as ILivechatContact;

describe('disableContact', () => {
	beforeEach(() => {
		modelsMock.LivechatContacts.findOneById.reset();
		modelsMock.LivechatVisitors.disableById.reset();
		modelsMock.LivechatContacts.disableByContactId.reset();
	});

	it('should disable the contact', async () => {
		modelsMock.LivechatContacts.findOneById.resolves(contact);
		modelsMock.LivechatContacts.disableByContactId.resolves();

		await disableContactById('contactId');

		expect(modelsMock.LivechatVisitors.disableById.called).to.be.true;
		expect(modelsMock.LivechatContacts.disableByContactId.getCall(0).args[0]).to.be.equal('contactId');
	});

	it('should throw error if contact is not found', async () => {
		modelsMock.LivechatContacts.findOneById.resolves(null);

		await expect(disableContactById('contactId')).to.be.rejectedWith('error-contact-not-found');

		expect(modelsMock.LivechatContacts.findOneById.getCall(0).args[0]).to.be.equal('contactId');
		expect(modelsMock.LivechatVisitors.disableById.called).to.be.false;
		expect(modelsMock.LivechatContacts.disableByContactId.called).to.be.false;
	});
});

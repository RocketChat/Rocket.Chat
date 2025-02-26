import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const modelsMock = {
	LivechatContacts: {
		findOneById: sinon.stub(),
		updateContact: sinon.stub(),
	},
	LivechatRooms: {
		updateContactDataByContactId: sinon.stub(),
	},
};

const { updateContact } = proxyquire.noCallThru().load('./updateContact', {
	'./getAllowedCustomFields': {
		getAllowedCustomFields: sinon.stub(),
	},
	'./validateContactManager': {
		validateContactManager: sinon.stub(),
	},
	'./validateCustomFields': {
		validateCustomFields: sinon.stub(),
	},

	'@rocket.chat/models': modelsMock,
});

describe('updateContact', () => {
	beforeEach(() => {
		modelsMock.LivechatContacts.findOneById.reset();
		modelsMock.LivechatContacts.updateContact.reset();
		modelsMock.LivechatRooms.updateContactDataByContactId.reset();
	});

	it('should throw an error if the contact does not exist', async () => {
		modelsMock.LivechatContacts.findOneById.resolves(undefined);
		await expect(updateContact('any_id')).to.be.rejectedWith('error-contact-not-found');
		expect(modelsMock.LivechatContacts.updateContact.getCall(0)).to.be.null;
	});

	it('should update the contact with correct params', async () => {
		modelsMock.LivechatContacts.findOneById.resolves({ _id: 'contactId' });
		modelsMock.LivechatContacts.updateContact.resolves({ _id: 'contactId', name: 'John Doe' } as any);

		const updatedContact = await updateContact({ contactId: 'contactId', name: 'John Doe' });

		expect(modelsMock.LivechatContacts.updateContact.getCall(0).args[0]).to.be.equal('contactId');
		expect(modelsMock.LivechatContacts.updateContact.getCall(0).args[1]).to.be.deep.contain({ name: 'John Doe' });
		expect(updatedContact).to.be.deep.equal({ _id: 'contactId', name: 'John Doe' });
	});
});

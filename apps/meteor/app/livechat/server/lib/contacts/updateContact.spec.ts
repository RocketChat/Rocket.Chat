import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const modelsMock = {
	LivechatContacts: {
		findOneEnabledById: sinon.stub(),
		patchContact: sinon.stub(),
	},
	LivechatRooms: {
		updateContactDataByContactId: sinon.stub(),
	},
};

const { patchContact } = proxyquire.noCallThru().load('./patchContact.ts', {
	'@rocket.chat/models': modelsMock,
});

const { updateContact } = proxyquire.noCallThru().load('./updateContact', {
	'./getAllowedCustomFields': {
		getAllowedCustomFields: sinon.stub().resolves([]),
	},
	'./validateContactManager': {
		validateContactManager: sinon.stub(),
	},
	'./validateCustomFields': {
		validateCustomFields: sinon.stub(),
	},

	'@rocket.chat/models': modelsMock,

	'./patchContact': {
		patchContact,
	},
});

describe('updateContact', () => {
	beforeEach(() => {
		modelsMock.LivechatContacts.findOneEnabledById.reset();
		modelsMock.LivechatContacts.patchContact.reset();
		modelsMock.LivechatRooms.updateContactDataByContactId.reset();
	});

	it('should throw an error if the contact does not exist', async () => {
		modelsMock.LivechatContacts.findOneEnabledById.resolves(undefined);
		await expect(updateContact('any_id')).to.be.rejectedWith('error-contact-not-found');
		expect(modelsMock.LivechatContacts.patchContact.getCall(0)).to.be.null;
	});

	it('should update the contact with correct params', async () => {
		modelsMock.LivechatContacts.findOneEnabledById.resolves({ _id: 'contactId' });
		modelsMock.LivechatContacts.patchContact.resolves({ _id: 'contactId', name: 'John Doe' } as any);

		const updatedContact = await updateContact({ contactId: 'contactId', name: 'John Doe' });

		expect(modelsMock.LivechatContacts.patchContact.getCall(0).args[0]).to.be.equal('contactId');
		expect(modelsMock.LivechatContacts.patchContact.getCall(0).args[1]).to.be.deep.contain({ set: { name: 'John Doe' } });
		expect(updatedContact).to.be.deep.equal({ _id: 'contactId', name: 'John Doe' });
	});

	it('should be able to clear the contact manager', async () => {
		modelsMock.LivechatContacts.findOneEnabledById.resolves({ _id: 'contactId', contactManager: 'manager' });
		modelsMock.LivechatContacts.patchContact.resolves({ _id: 'contactId' } as any);

		const updatedContact = await updateContact({ contactId: 'contactId', contactManager: null });

		expect(modelsMock.LivechatContacts.patchContact.getCall(0).args[0]).to.be.equal('contactId');
		expect(modelsMock.LivechatContacts.patchContact.getCall(0).args[1]).to.be.deep.contain({ unset: ['contactManager'] });
		expect(updatedContact).to.be.deep.equal({ _id: 'contactId' });
	});
});

import { before, beforeEach, describe, it, mock } from 'node:test';

import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
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

let updateContact: any;

before(async () => {
	const moduleMocks = [
		mock.module('./getAllowedCustomFields', {
			exports: {
				getAllowedCustomFields: sinon.stub().resolves([]),
			},
		}),
		mock.module('./validateContactManager', {
			exports: {
				validateContactManager: sinon.stub(),
			},
		}),
		mock.module('./validateCustomFields', {
			exports: {
				validateCustomFields: sinon.stub(),
			},
		}),
		mock.module('../../notifyListener', {
			exports: {
				notifyOnSubscriptionChangedByVisitorIds: sinon.stub(),
				notifyOnRoomChangedByContactId: sinon.stub(),
				notifyOnLivechatInquiryChangedByVisitorIds: sinon.stub(),
				notifyOnSettingChanged: sinon.stub(),
			},
		}),
	];
	({ updateContact } = await import('./updateContact'));
	moduleMocks.forEach((moduleMock) => moduleMock.restore());
});

describe('updateContact', () => {
	before(() => {
		mockModel('LivechatContacts', modelsMock.LivechatContacts);
		mockModel('LivechatRooms', modelsMock.LivechatRooms);
	});

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

	it('should be able to clear the contact manager when passing an empty string for contactManager', async () => {
		modelsMock.LivechatContacts.findOneEnabledById.resolves({ _id: 'contactId', contactManager: 'manager' });
		modelsMock.LivechatContacts.patchContact.resolves({ _id: 'contactId' } as any);

		const updatedContact = await updateContact({ contactId: 'contactId', contactManager: '' });

		expect(modelsMock.LivechatContacts.patchContact.getCall(0).args[0]).to.be.equal('contactId');
		expect(modelsMock.LivechatContacts.patchContact.getCall(0).args[1]).to.be.deep.contain({ unset: { contactManager: '' } });
		expect(updatedContact).to.be.deep.equal({ _id: 'contactId' });
	});

	it('should be able to clear the contact manager when passing undefined for contactManager', async () => {
		modelsMock.LivechatContacts.findOneEnabledById.resolves({ _id: 'contactId', contactManager: 'manager' });
		modelsMock.LivechatContacts.patchContact.resolves({ _id: 'contactId' } as any);

		const updatedContact = await updateContact({ contactId: 'contactId', contactManager: undefined });
		expect(modelsMock.LivechatContacts.patchContact.getCall(0).args[0]).to.be.equal('contactId');
		expect(modelsMock.LivechatContacts.patchContact.getCall(0).args[1]).to.be.deep.contain({ unset: { contactManager: '' } });
		expect(updatedContact).to.be.deep.equal({ _id: 'contactId' });
	});
});

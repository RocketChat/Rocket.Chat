import { expect } from 'chai';
import { beforeEach, describe, it, vi } from 'vitest';

import type { UpdateContactParams } from './updateContact';

const { modelsMock, getAllowedCustomFields, validateContactManager, validateCustomFields, sandbox } = vi.hoisted(() => {
	const sinon = require('sinon');
	const sandbox = sinon.createSandbox();
	return {
		sandbox,
		getAllowedCustomFields: sandbox.stub().resolves([]),
		validateContactManager: sandbox.stub(),
		validateCustomFields: sandbox.stub(),
		modelsMock: {
			LivechatContacts: {
				findOneEnabledById: sandbox.stub(),
				patchContact: sandbox.stub(),
			},
			LivechatRooms: {
				updateContactDataByContactId: sandbox.stub(),
			},
		},
	};
});

vi.mock('@rocket.chat/models', () => ({
	LivechatContacts: modelsMock.LivechatContacts,
	LivechatRooms: modelsMock.LivechatRooms,
}));
vi.mock('./getAllowedCustomFields', () => ({ getAllowedCustomFields }));
vi.mock('./validateContactManager', () => ({ validateContactManager }));
vi.mock('./validateCustomFields', () => ({ validateCustomFields }));
// notifyListener side effects are fire-and-forget (`void`) and never asserted on; stub them so the
// real implementations (which need broker/model methods) don't surface as unhandled rejections.
vi.mock('../../../../lib/server/lib/notifyListener', () => ({
	notifyOnSubscriptionChangedByVisitorIds: sandbox.stub(),
	notifyOnRoomChangedByContactId: sandbox.stub(),
	notifyOnLivechatInquiryChangedByVisitorIds: sandbox.stub(),
	notifyOnSettingChanged: sandbox.stub(),
}));

// patchContact is intentionally NOT mocked: the real implementation runs against the mocked
// `@rocket.chat/models`, matching the original test which loaded the real patchContact.
const { updateContact } = await import('./updateContact');

describe('updateContact', () => {
	beforeEach(() => {
		sandbox.reset();
		getAllowedCustomFields.resolves([]);
	});

	it('should throw an error if the contact does not exist', async () => {
		modelsMock.LivechatContacts.findOneEnabledById.resolves(undefined);
		await expect(updateContact('any_id' as unknown as UpdateContactParams)).to.be.rejectedWith('error-contact-not-found');
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

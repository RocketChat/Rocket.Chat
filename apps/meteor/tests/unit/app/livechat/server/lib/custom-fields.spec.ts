import type { ILivechatContact } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const modelsMock = {
	LivechatContacts: {
		updateContact: sinon.stub(),
	},
};

const { updateContactsCustomFields } = proxyquire.noCallThru().load('../../../../../../app/livechat/server/lib/custom-fields.ts', {
	'@rocket.chat/models': modelsMock,
});

describe('[CustomFields] updateContactsCustomFields', () => {
	beforeEach(() => {
		modelsMock.LivechatContacts.updateContact.reset();
	});

	it('should update the contact with the updated custom field', async () => {
		const contact: Partial<ILivechatContact> = {
			_id: 'contactId',
			customFields: {
				customField: 'value',
			},
		};

		modelsMock.LivechatContacts.updateContact.resolves({ ...contact, customFields: { customField: 'newValue' } });

		await updateContactsCustomFields(contact, 'customField', 'newValue', true);

		expect(modelsMock.LivechatContacts.updateContact.getCall(0).args[0]).to.be.equal('contactId');
		expect(modelsMock.LivechatContacts.updateContact.getCall(0).args[1]).to.be.deep.contain({
			customFields: { customField: 'newValue' },
		});
	});

	it('should update the contact with the new custom fields', async () => {
		const contact: Partial<ILivechatContact> = {
			_id: 'contactId',
			customFields: {
				customField: 'value',
			},
		};

		modelsMock.LivechatContacts.updateContact.resolves({ ...contact, customFields: { customField: 'value', customField2: 'value' } });

		await updateContactsCustomFields(contact, 'customField2', 'value', true);

		expect(modelsMock.LivechatContacts.updateContact.getCall(0).args[0]).to.be.equal('contactId');
		expect(modelsMock.LivechatContacts.updateContact.getCall(0).args[1]).to.be.deep.contain({
			customFields: { customField: 'value', customField2: 'value' },
		});
	});

	it('should not update the contact if the custom fields are the same', async () => {
		const contact: Partial<ILivechatContact> = {
			_id: 'contactId',
			customFields: {
				customField: 'value',
			},
		};

		await updateContactsCustomFields(contact, 'customField', 'value', true);

		expect(modelsMock.LivechatContacts.updateContact.called).to.be.false;
	});

	it('should add the custom field as a conflict if overwrite is false', async () => {	});
});

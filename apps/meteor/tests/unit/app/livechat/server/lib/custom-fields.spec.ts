import type { ILivechatContact } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const modelsMock = {
	LivechatContacts: {
		updateContactCustomFields: sinon.stub(),
	},
};

const { updateContactsCustomFields } = proxyquire.noCallThru().load('../../../../../../app/livechat/server/lib/custom-fields.ts', {
	'@rocket.chat/models': modelsMock,
});

describe('[Custom Fields] updateContactsCustomFields', () => {
	beforeEach(() => {
		modelsMock.LivechatContacts.updateContactCustomFields.reset();
	});

	it('should not add conflictingFields to the update data when its nullish', async () => {
		const contact: Partial<ILivechatContact> = {
			_id: 'contactId',
			customFields: {
				customField: 'value',
			},
		};

		modelsMock.LivechatContacts.updateContactCustomFields.resolves({ ...contact, customFields: { customField: 'newValue' } });

		await updateContactsCustomFields(contact, 'customField', 'newValue', true);

		expect(modelsMock.LivechatContacts.updateContactCustomFields.calledOnce).to.be.true;
		expect(modelsMock.LivechatContacts.updateContactCustomFields.getCall(0).args[0]).to.be.equal('contactId');
		expect(modelsMock.LivechatContacts.updateContactCustomFields.getCall(0).args[1]).to.deep.equal({
			customFields: { customField: 'newValue' },
		});
	});

	it('should add conflictingFields to the update data only when it is modified', async () => {
		const contact: Partial<ILivechatContact> = {
			_id: 'contactId',
			customFields: {
				customField: 'value',
			},
		};

		modelsMock.LivechatContacts.updateContactCustomFields.resolves({
			...contact,
			conflictingFields: [{ field: 'customFields.customField', value: 'newValue' }],
		});

		await updateContactsCustomFields(contact, 'customField', 'newValue', false);

		expect(modelsMock.LivechatContacts.updateContactCustomFields.calledOnce).to.be.true;
		expect(modelsMock.LivechatContacts.updateContactCustomFields.getCall(0).args[0]).to.be.equal('contactId');
		expect(modelsMock.LivechatContacts.updateContactCustomFields.getCall(0).args[1]).to.deep.equal({
			conflictingFields: [{ field: 'customFields.customField', value: 'newValue' }],
		});
	});
});

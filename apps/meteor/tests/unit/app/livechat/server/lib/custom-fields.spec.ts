import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const modelsMock = {
	LivechatContacts: {
		updateById: sinon.stub(),
	},
};

const { updateContactsCustomFields } = proxyquire.noCallThru().load('../../../../../../app/livechat/server/lib/custom-fields.ts', {
	'@rocket.chat/models': modelsMock,
});

describe('[Custom Fields] updateContactsCustomFields', () => {
	beforeEach(() => {
		modelsMock.LivechatContacts.updateById.reset();
	});

	it('should do nothing if validCustomFields param is empty', async () => {
		const contact = { _id: 'contactId', customFields: {} } as any;
		await updateContactsCustomFields(contact, []);
		expect(modelsMock.LivechatContacts.updateById.called).to.be.false;
	});
	it('should add a custom field from the validCustomFields param', async () => {
		const contact = { _id: 'contactId', customFields: {} } as any;
		const validCustomFields = [{ key: 'field1', value: 'value1', overwrite: true }];
		await updateContactsCustomFields(contact, validCustomFields);
		expect(modelsMock.LivechatContacts.updateById.calledOnce).to.be.true;
		expect(modelsMock.LivechatContacts.updateById.firstCall.args[0]).to.equal('contactId');
		expect(modelsMock.LivechatContacts.updateById.firstCall.args[1]).to.deep.equal({
			$set: { customFields: { field1: 'value1' } },
		});
	});
	it('should add multiple custom fields from the validCustomFields param', async () => {
		const contact = { _id: 'contactId', customFields: {} } as any;
		const validCustomFields = [
			{ key: 'field1', value: 'value1', overwrite: true },
			{ key: 'field2', value: 'value2', overwrite: true },
		];
		await updateContactsCustomFields(contact, validCustomFields);
		expect(modelsMock.LivechatContacts.updateById.calledOnce).to.be.true;
		expect(modelsMock.LivechatContacts.updateById.firstCall.args[0]).to.equal('contactId');
		expect(modelsMock.LivechatContacts.updateById.firstCall.args[1]).to.deep.equal({
			$set: { customFields: { field1: 'value1', field2: 'value2' } },
		});
	});
	it('should add custom field to conflictingFields when the contact already has the field and overwrite is false', async () => {
		const contact = { _id: 'contactId', customFields: { field1: 'existingValue' } } as any;
		const validCustomFields = [{ key: 'field1', value: 'newValue', overwrite: false }];
		await updateContactsCustomFields(contact, validCustomFields);
		expect(modelsMock.LivechatContacts.updateById.calledOnce).to.be.true;
		expect(modelsMock.LivechatContacts.updateById.firstCall.args[0]).to.equal('contactId');
		expect(modelsMock.LivechatContacts.updateById.firstCall.args[1]).to.deep.equal({
			$set: { conflictingFields: [{ field: 'customFields.field1', value: 'newValue' }] },
		});
	});
	it('should correctly add custom field and conflicting field from validCustomFields array', async () => {
		const contact = { _id: 'contactId', customFields: { field1: 'existingValue' } } as any;
		const validCustomFields = [
			{ key: 'field1', value: 'newValue', overwrite: false },
			{ key: 'field2', value: 'value2', overwrite: true },
		];
		await updateContactsCustomFields(contact, validCustomFields);
		expect(modelsMock.LivechatContacts.updateById.calledOnce).to.be.true;
		expect(modelsMock.LivechatContacts.updateById.firstCall.args[0]).to.equal('contactId');
		expect(modelsMock.LivechatContacts.updateById.firstCall.args[1]).to.deep.equal({
			$set: { customFields: { field2: 'value2' }, conflictingFields: [{ field: 'customFields.field1', value: 'newValue' }] },
		});
	});
	it('should overwrite an existing field when field is on validCustomFields array & overwrite is true', async () => {
		const contact = { _id: 'contactId', customFields: { field1: 'existingValue' } } as any;
		const validCustomFields = [
			{ key: 'field1', value: 'newValue', overwrite: true },
			{ key: 'field2', value: 'value2', overwrite: true },
		];
		await updateContactsCustomFields(contact, validCustomFields);
		expect(modelsMock.LivechatContacts.updateById.calledOnce).to.be.true;
		expect(modelsMock.LivechatContacts.updateById.firstCall.args[0]).to.equal('contactId');
		expect(modelsMock.LivechatContacts.updateById.firstCall.args[1]).to.deep.equal({
			$set: { customFields: { field1: 'newValue', field2: 'value2' } },
		});
	});
	it('should update all custom fields from the validCustomFields array without issues', async () => {
		const contact = { _id: 'contactId', customFields: { field1: 'existingValue' } } as any;
		const validCustomFields = [
			{ key: 'field1', value: 'newValue', overwrite: true },
			{ key: 'field2', value: 'value2', overwrite: true },
			{ key: 'field3', value: 'value3', overwrite: true },
			{ key: 'field4', value: 'value4', overwrite: true },
			{ key: 'field5', value: 'value5', overwrite: true },
		];
		await updateContactsCustomFields(contact, validCustomFields);
		expect(modelsMock.LivechatContacts.updateById.calledOnce).to.be.true;
		expect(modelsMock.LivechatContacts.updateById.firstCall.args[0]).to.equal('contactId');
		expect(modelsMock.LivechatContacts.updateById.firstCall.args[1]).to.deep.equal({
			$set: { customFields: { field1: 'newValue', field2: 'value2', field3: 'value3', field4: 'value4', field5: 'value5' } },
		});
	});
});

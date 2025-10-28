import type { ILivechatContact } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const modelsMock = {
	LivechatContacts: {
		findOneEnabledById: sinon.stub(),
		updateContact: sinon.stub(),
	},
	Settings: {
		incrementValueById: sinon.stub(),
	},
};

const validateContactManagerMock = sinon.stub();

const { resolveContactConflicts } = proxyquire.noCallThru().load('./resolveContactConflicts', {
	'@rocket.chat/models': modelsMock,
	'./validateContactManager': {
		validateContactManager: validateContactManagerMock,
	},
});

describe('resolveContactConflicts', () => {
	beforeEach(() => {
		modelsMock.LivechatContacts.findOneEnabledById.reset();
		modelsMock.Settings.incrementValueById.reset();
		modelsMock.LivechatContacts.updateContact.reset();
	});

	it('should update the contact with the resolved custom field', async () => {
		modelsMock.LivechatContacts.findOneEnabledById.resolves({
			_id: 'contactId',
			customFields: { customField: 'newValue' },
			conflictingFields: [{ field: 'customFields.customField', value: 'oldValue' }],
		});
		modelsMock.Settings.incrementValueById.resolves(1);
		modelsMock.LivechatContacts.updateContact.resolves({
			_id: 'contactId',
			customField: { customField: 'newValue' },
			conflictingFields: [{ field: 'customFields.customField', value: 'oldValue' }],
		} as Partial<ILivechatContact>);

		const result = await resolveContactConflicts({ contactId: 'contactId', customField: { customField: 'newValue' } });

		expect(modelsMock.LivechatContacts.findOneEnabledById.getCall(0).args[0]).to.be.equal('contactId');

		expect(modelsMock.Settings.incrementValueById.getCall(0).args[0]).to.be.equal('Livechat_conflicting_fields_counter');
		expect(modelsMock.Settings.incrementValueById.getCall(0).args[1]).to.be.equal(1);

		expect(modelsMock.LivechatContacts.updateContact.getCall(0).args[0]).to.be.equal('contactId');
		expect(modelsMock.LivechatContacts.updateContact.getCall(0).args[1]).to.be.deep.contain({ customFields: { customField: 'newValue' } });
		expect(result).to.be.deep.equal({
			_id: 'contactId',
			customField: { customField: 'newValue' },
			conflictingFields: [],
		});
	});

	it('should update the contact with the resolved name', async () => {
		modelsMock.LivechatContacts.findOneEnabledById.resolves({
			_id: 'contactId',
			name: 'Old Name',
			customFields: { customField: 'newValue' },
			conflictingFields: [{ field: 'name', value: 'Old Name' }],
		});
		modelsMock.Settings.incrementValueById.resolves(1);
		modelsMock.LivechatContacts.updateContact.resolves({
			_id: 'contactId',
			name: 'New Name',
			customField: { customField: 'newValue' },
			conflictingFields: [],
		} as Partial<ILivechatContact>);

		const result = await resolveContactConflicts({ contactId: 'contactId', name: 'New Name' });

		expect(modelsMock.LivechatContacts.findOneEnabledById.getCall(0).args[0]).to.be.equal('contactId');

		expect(modelsMock.Settings.incrementValueById.getCall(0).args[0]).to.be.equal('Livechat_conflicting_fields_counter');
		expect(modelsMock.Settings.incrementValueById.getCall(0).args[1]).to.be.equal(1);

		expect(modelsMock.LivechatContacts.updateContact.getCall(0).args[0]).to.be.equal('contactId');
		expect(modelsMock.LivechatContacts.updateContact.getCall(0).args[1]).to.be.deep.contain({ name: 'New Name' });
		expect(result).to.be.deep.equal({
			_id: 'contactId',
			name: 'New Name',
			customField: { customField: 'newValue' },
			conflictingFields: [],
		});
	});

	it('should update the contact with the resolved contact manager', async () => {
		modelsMock.LivechatContacts.findOneEnabledById.resolves({
			_id: 'contactId',
			name: 'Name',
			contactManager: 'contactManagerId',
			customFields: { customField: 'value' },
			conflictingFields: [{ field: 'manager', value: 'newContactManagerId' }],
		});
		modelsMock.Settings.incrementValueById.resolves(1);
		modelsMock.LivechatContacts.updateContact.resolves({
			_id: 'contactId',
			name: 'Name',
			contactManager: 'newContactManagerId',
			customField: { customField: 'value' },
			conflictingFields: [],
		} as Partial<ILivechatContact>);

		const result = await resolveContactConflicts({ contactId: 'contactId', name: 'New Name' });

		expect(modelsMock.LivechatContacts.findOneEnabledById.getCall(0).args[0]).to.be.equal('contactId');

		expect(modelsMock.Settings.incrementValueById.getCall(0).args[0]).to.be.equal('Livechat_conflicting_fields_counter');
		expect(modelsMock.Settings.incrementValueById.getCall(0).args[1]).to.be.equal(1);

		expect(modelsMock.LivechatContacts.updateContact.getCall(0).args[0]).to.be.equal('contactId');
		expect(modelsMock.LivechatContacts.updateContact.getCall(0).args[1]).to.be.deep.contain({ contactManager: 'newContactManagerId' });
		expect(result).to.be.deep.equal({
			_id: 'contactId',
			name: 'New Name',
			customField: { customField: 'newValue' },
			conflictingFields: [],
		});
	});

	it('should wipe conflicts if wipeConflicts = true', async () => {
		it('should update the contact with the resolved name', async () => {
			modelsMock.LivechatContacts.findOneEnabledById.resolves({
				_id: 'contactId',
				name: 'Name',
				customFields: { customField: 'newValue' },
				conflictingFields: [
					{ field: 'name', value: 'NameTest' },
					{ field: 'customFields.customField', value: 'value' },
				],
			});
			modelsMock.Settings.incrementValueById.resolves(2);
			modelsMock.LivechatContacts.updateContact.resolves({
				_id: 'contactId',
				name: 'New Name',
				customField: { customField: 'newValue' },
				conflictingFields: [],
			} as Partial<ILivechatContact>);

			const result = await resolveContactConflicts({ contactId: 'contactId', name: 'New Name', wipeConflicts: true });

			expect(modelsMock.LivechatContacts.findOneEnabledById.getCall(0).args[0]).to.be.equal('contactId');

			expect(modelsMock.Settings.incrementValueById.getCall(0).args[0]).to.be.equal('Livechat_conflicting_fields_counter');
			expect(modelsMock.Settings.incrementValueById.getCall(0).args[1]).to.be.equal(2);

			expect(modelsMock.LivechatContacts.updateContact.getCall(0).args[0]).to.be.equal('contactId');
			expect(modelsMock.LivechatContacts.updateContact.getCall(0).args[1]).to.be.deep.contain({ name: 'New Name' });
			expect(result).to.be.deep.equal({
				_id: 'contactId',
				name: 'New Name',
				customField: { customField: 'newValue' },
				conflictingFields: [],
			});
		});
	});

	it('should wipe conflicts if wipeConflicts = true', async () => {
		it('should update the contact with the resolved name', async () => {
			modelsMock.LivechatContacts.findOneEnabledById.resolves({
				_id: 'contactId',
				name: 'Name',
				customFields: { customField: 'newValue' },
				conflictingFields: [
					{ field: 'name', value: 'NameTest' },
					{ field: 'customFields.customField', value: 'value' },
				],
			});
			modelsMock.Settings.incrementValueById.resolves(2);
			modelsMock.LivechatContacts.updateContact.resolves({
				_id: 'contactId',
				name: 'New Name',
				customField: { customField: 'newValue' },
				conflictingFields: [],
			} as Partial<ILivechatContact>);

			const result = await resolveContactConflicts({ contactId: 'contactId', name: 'New Name', wipeConflicts: false });

			expect(modelsMock.LivechatContacts.findOneEnabledById.getCall(0).args[0]).to.be.equal('contactId');

			expect(modelsMock.Settings.incrementValueById.getCall(0).args[0]).to.be.equal('Livechat_conflicting_fields_counter');
			expect(modelsMock.Settings.incrementValueById.getCall(0).args[1]).to.be.equal(1);

			expect(modelsMock.LivechatContacts.updateContact.getCall(0).args[0]).to.be.equal('contactId');
			expect(modelsMock.LivechatContacts.updateContact.getCall(0).args[1]).to.be.deep.contain({ name: 'New Name' });
			expect(result).to.be.deep.equal({
				_id: 'contactId',
				name: 'New Name',
				customField: { customField: 'newValue' },
				conflictingFields: [{ field: 'customFields.customField', value: 'value' }],
			});
		});
	});

	it('should throw an error if the contact does not exist', async () => {
		modelsMock.LivechatContacts.findOneEnabledById.resolves(undefined);
		await expect(resolveContactConflicts({ contactId: 'id', customField: { customField: 'newValue' } })).to.be.rejectedWith(
			'error-contact-not-found',
		);
		expect(modelsMock.LivechatContacts.updateContact.getCall(0)).to.be.null;
	});

	it('should throw an error if the contact has no conflicting fields', async () => {
		modelsMock.LivechatContacts.findOneEnabledById.resolves({
			_id: 'contactId',
			name: 'Name',
			contactManager: 'contactManagerId',
			customFields: { customField: 'value' },
			conflictingFields: [],
		});
		await expect(resolveContactConflicts({ contactId: 'id', customField: { customField: 'newValue' } })).to.be.rejectedWith(
			'error-contact-has-no-conflicts',
		);
		expect(modelsMock.LivechatContacts.updateContact.getCall(0)).to.be.null;
	});

	it('should throw an error if the contact manager is invalid', async () => {
		modelsMock.LivechatContacts.findOneEnabledById.resolves({
			_id: 'contactId',
			name: 'Name',
			contactManager: 'contactManagerId',
			customFields: { customField: 'value' },
			conflictingFields: [{ field: 'manager', value: 'newContactManagerId' }],
		});
		await expect(resolveContactConflicts({ contactId: 'id', contactManager: 'invalid' })).to.be.rejectedWith(
			'error-contact-manager-not-found',
		);

		expect(validateContactManagerMock.getCall(0).args[0]).to.be.equal('invalid');

		expect(modelsMock.LivechatContacts.updateContact.getCall(0)).to.be.null;
	});
});

import type { ILivechatContact } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const modelsMock = {
	LivechatContacts: {
		findOneEnabledById: sinon.stub(),
		patchContact: sinon.stub(),
	},
	Settings: {
		incrementValueById: sinon.stub(),
	},
};

const validateContactManagerMock = sinon.stub();

const { patchContact } = proxyquire.noCallThru().load('./patchContact.ts', {
	'@rocket.chat/models': modelsMock,
});

const { resolveContactConflicts } = proxyquire.noCallThru().load('./resolveContactConflicts', {
	'@rocket.chat/models': modelsMock,
	'./validateContactManager': {
		validateContactManager: validateContactManagerMock,
	},
	'./patchContact': {
		patchContact,
	},
});

describe('resolveContactConflicts', () => {
	beforeEach(() => {
		modelsMock.LivechatContacts.findOneEnabledById.reset();
		modelsMock.Settings.incrementValueById.reset();
		modelsMock.LivechatContacts.patchContact.reset();
		validateContactManagerMock.reset();
	});

	it('should update the contact with the resolved custom field', async () => {
		modelsMock.LivechatContacts.findOneEnabledById.resolves({
			_id: 'contactId',
			customFields: { customField: 'newValue' },
			conflictingFields: [{ field: 'customFields.customField', value: 'oldValue' }],
		});
		modelsMock.Settings.incrementValueById.resolves(1);
		modelsMock.LivechatContacts.patchContact.resolves({
			_id: 'contactId',
			customFields: { customField: 'newestValue' },
			conflictingFields: [],
		} as Partial<ILivechatContact>);

		await resolveContactConflicts({ contactId: 'contactId', customFields: { customField: 'newestValue' } });

		expect(modelsMock.LivechatContacts.findOneEnabledById.getCall(0).args[0]).to.be.equal('contactId');

		expect(modelsMock.LivechatContacts.patchContact.getCall(0).args[0]).to.be.equal('contactId');
		expect(modelsMock.LivechatContacts.patchContact.getCall(0).args[1]).to.be.deep.contain({
			set: {
				customFields: { customField: 'newestValue' },
				conflictingFields: [],
			},
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
		modelsMock.LivechatContacts.patchContact.resolves({
			_id: 'contactId',
			name: 'New Name',
			customFields: { customField: 'newValue' },
			conflictingFields: [],
		} as Partial<ILivechatContact>);

		await resolveContactConflicts({ contactId: 'contactId', name: 'New Name' });

		expect(modelsMock.LivechatContacts.findOneEnabledById.getCall(0).args[0]).to.be.equal('contactId');

		expect(modelsMock.LivechatContacts.patchContact.getCall(0).args[0]).to.be.equal('contactId');
		expect(modelsMock.LivechatContacts.patchContact.getCall(0).args[1]).to.be.deep.contain({
			set: {
				name: 'New Name',
				conflictingFields: [],
			},
		});
	});

	it('should update the contact with the resolved contact manager', async () => {
		modelsMock.LivechatContacts.findOneEnabledById.resolves({
			_id: 'contactId',
			name: 'Name',
			contactManager: 'contactManagerId',
			customFields: { customField: 'value' },
			conflictingFields: [{ field: 'manager', value: 'oldManagerId' }],
		});
		validateContactManagerMock.resolves();
		modelsMock.Settings.incrementValueById.resolves(1);
		modelsMock.LivechatContacts.patchContact.resolves({
			_id: 'contactId',
			name: 'Name',
			contactManager: 'newContactManagerId',
			customFields: { customField: 'value' },
			conflictingFields: [],
		} as Partial<ILivechatContact>);

		await resolveContactConflicts({ contactId: 'contactId', contactManager: 'newContactManagerId' });

		expect(modelsMock.LivechatContacts.findOneEnabledById.getCall(0).args[0]).to.be.equal('contactId');
		expect(validateContactManagerMock.getCall(0).args[0]).to.be.equal('newContactManagerId');

		expect(modelsMock.LivechatContacts.patchContact.getCall(0).args[0]).to.be.equal('contactId');
		expect(modelsMock.LivechatContacts.patchContact.getCall(0).args[1]).to.be.deep.contain({
			set: {
				contactManager: 'newContactManagerId',
				conflictingFields: [],
			},
		});
	});

	it('should wipe all conflicts if wipeConflicts = true', async () => {
		modelsMock.LivechatContacts.findOneEnabledById.resolves({
			_id: 'contactId',
			name: 'Name',
			customFields: { customField: 'newValue' },
			conflictingFields: [
				{ field: 'name', value: 'NameTest' },
				{ field: 'customFields.customField', value: 'value' },
			],
		});
		modelsMock.Settings.incrementValueById.resolves({ _id: 'Resolved_Conflicts_Count', value: 2 });
		modelsMock.LivechatContacts.patchContact.resolves({
			_id: 'contactId',
			name: 'New Name',
			customFields: { customField: 'newValue' },
			conflictingFields: [],
		} as Partial<ILivechatContact>);

		const result = await resolveContactConflicts({ contactId: 'contactId', name: 'New Name', wipeConflicts: true });

		expect(modelsMock.LivechatContacts.findOneEnabledById.getCall(0).args[0]).to.be.equal('contactId');

		expect(modelsMock.Settings.incrementValueById.getCall(0).args[0]).to.be.equal('Resolved_Conflicts_Count');
		expect(modelsMock.Settings.incrementValueById.getCall(0).args[1]).to.be.equal(2);

		expect(modelsMock.LivechatContacts.patchContact.getCall(0).args[0]).to.be.equal('contactId');
		expect(modelsMock.LivechatContacts.patchContact.getCall(0).args[1]).to.be.deep.contain({
			set: {
				name: 'New Name',
				conflictingFields: [],
			},
		});
		expect(result).to.be.deep.equal({
			_id: 'contactId',
			name: 'New Name',
			customFields: { customField: 'newValue' },
			conflictingFields: [],
		});
	});

	it('should only resolve specified conflicts when wipeConflicts = false', async () => {
		modelsMock.LivechatContacts.findOneEnabledById.resolves({
			_id: 'contactId',
			name: 'Name',
			customFields: { customField: 'newValue' },
			conflictingFields: [
				{ field: 'name', value: 'NameTest' },
				{ field: 'customFields.customField', value: 'value' },
			],
		});
		modelsMock.LivechatContacts.patchContact.resolves({
			_id: 'contactId',
			name: 'New Name',
			customFields: { customField: 'newValue' },
			conflictingFields: [{ field: 'customFields.customField', value: 'value' }],
		} as Partial<ILivechatContact>);

		const result = await resolveContactConflicts({ contactId: 'contactId', name: 'New Name', wipeConflicts: false });

		expect(modelsMock.LivechatContacts.findOneEnabledById.getCall(0).args[0]).to.be.equal('contactId');

		// When wipeConflicts is false, incrementValueById should NOT be called
		expect(modelsMock.Settings.incrementValueById.called).to.be.false;

		expect(modelsMock.LivechatContacts.patchContact.getCall(0).args[0]).to.be.equal('contactId');
		expect(modelsMock.LivechatContacts.patchContact.getCall(0).args[1]).to.be.deep.contain({
			set: {
				name: 'New Name',
				conflictingFields: [{ field: 'customFields.customField', value: 'value' }],
			},
		});
		expect(result).to.be.deep.equal({
			_id: 'contactId',
			name: 'New Name',
			customFields: { customField: 'newValue' },
			conflictingFields: [{ field: 'customFields.customField', value: 'value' }],
		});
	});

	it('should throw an error if the contact does not exist', async () => {
		modelsMock.LivechatContacts.findOneEnabledById.resolves(undefined);
		await expect(resolveContactConflicts({ contactId: 'id', customFields: { customField: 'newValue' } })).to.be.rejectedWith(
			'error-contact-not-found',
		);
		expect(modelsMock.LivechatContacts.patchContact.called).to.be.false;
	});

	it('should throw an error if the contact has no conflicting fields', async () => {
		modelsMock.LivechatContacts.findOneEnabledById.resolves({
			_id: 'contactId',
			name: 'Name',
			contactManager: 'contactManagerId',
			customFields: { customField: 'value' },
			conflictingFields: [],
		});
		await expect(resolveContactConflicts({ contactId: 'id', customFields: { customField: 'newValue' } })).to.be.rejectedWith(
			'error-contact-has-no-conflicts',
		);
		expect(modelsMock.LivechatContacts.patchContact.called).to.be.false;
	});

	it('should unset contactManager when explicitly set to empty string', async () => {
		modelsMock.LivechatContacts.findOneEnabledById.resolves({
			_id: 'contactId',
			name: 'Name',
			contactManager: 'oldManagerId',
			customFields: { customField: 'value' },
			conflictingFields: [{ field: 'manager', value: 'oldManagerId' }],
		});
		modelsMock.LivechatContacts.patchContact.resolves({
			_id: 'contactId',
			name: 'Name',
			customFields: { customField: 'value' },
			conflictingFields: [],
		} as Partial<ILivechatContact>);

		await resolveContactConflicts({ contactId: 'contactId', contactManager: '' });

		expect(modelsMock.LivechatContacts.patchContact.getCall(0).args[1]).to.deep.include({
			set: {
				conflictingFields: [],
			},
			unset: ['contactManager'],
		});
		expect(validateContactManagerMock.called).to.be.false;
	});

	it('should unset contactManager when explicitly set to undefined', async () => {
		modelsMock.LivechatContacts.findOneEnabledById.resolves({
			_id: 'contactId',
			name: 'Name',
			contactManager: 'oldManagerId',
			customFields: { customField: 'value' },
			conflictingFields: [{ field: 'manager', value: 'oldManagerId' }],
		});
		modelsMock.LivechatContacts.patchContact.resolves({
			_id: 'contactId',
			name: 'Name',
			customFields: { customField: 'value' },
			conflictingFields: [],
		} as Partial<ILivechatContact>);

		await resolveContactConflicts({ contactId: 'contactId', contactManager: undefined });

		expect(modelsMock.LivechatContacts.patchContact.getCall(0).args[1]).to.deep.include({
			set: {
				conflictingFields: [],
			},
			unset: ['contactManager'],
		});
		expect(validateContactManagerMock.called).to.be.false;
	});
});

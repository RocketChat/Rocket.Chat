import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const modelsMock = {
	LivechatContacts: {
		findOneById: sinon.stub(),
		updateContact: sinon.stub(),
	},
	Settings: {
		incrementValueById: sinon.stub(),
	},
};

const { resolveContactConflicts } = proxyquire.noCallThru().load('./resolveContactConflicts', {
	'@rocket.chat/models': modelsMock,
});

describe('resolveContactConflicts', () => {
	beforeEach(() => {
		modelsMock.LivechatContacts.findOneById.reset();
		modelsMock.Settings.incrementValueById.reset();
		modelsMock.LivechatContacts.updateContact.reset();
	});

	it('should update the contact with the resolved custom field', async () => {
		modelsMock.LivechatContacts.findOneById.resolves({
			_id: 'contactId',
			customFields: { customField: 'newValue' },
			conflictingFields: [{ field: 'customFields.customField', value: 'oldValue' }],
		});
		modelsMock.Settings.incrementValueById.resolves(1);
		modelsMock.LivechatContacts.updateContact.resolves({
			_id: 'contactId',
			customField: { customField: 'newValue' },
			conflictingFields: [{ field: 'customFields.customField', value: 'oldValue' }],
		} as any);

		const result = await resolveContactConflicts({ contactId: 'contactId', customField: { customField: 'newValue' } });

		expect(modelsMock.LivechatContacts.findOneById.getCall(0).args[0]).to.be.equal('contactId');

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

	it('should throw an error if the contact does not exist', async () => {
		modelsMock.LivechatContacts.findOneById.resolves(undefined);
		await expect(resolveContactConflicts({ contactId: 'id', customField: { customField: 'newValue' } })).to.be.rejectedWith(
			'error-contact-not-found',
		);
		expect(modelsMock.LivechatContacts.updateContact.getCall(0)).to.be.null;
	});
});

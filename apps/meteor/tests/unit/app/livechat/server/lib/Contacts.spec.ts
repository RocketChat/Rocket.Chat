import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const modelsMock = {
	Users: {
		findOneAgentById: sinon.stub(),
	},
	LivechatContacts: {
		findOneById: sinon.stub(),
		updateContact: sinon.stub(),
	},
};
const { validateCustomFields, validateContactManager, updateContact } = proxyquire
	.noCallThru()
	.load('../../../../../../app/livechat/server/lib/Contacts', {
		'meteor/check': sinon.stub(),
		'meteor/meteor': sinon.stub(),
		'@rocket.chat/models': modelsMock,
	});

describe('[OC] Contacts', () => {
	describe('validateCustomFields', () => {
		const mockCustomFields = [{ _id: 'cf1', label: 'Custom Field 1', regexp: '^[0-9]+$', required: true }];

		it('should validate custom fields correctly', () => {
			expect(() => validateCustomFields(mockCustomFields, { cf1: '123' })).to.not.throw();
		});

		it('should throw an error if a required custom field is missing', () => {
			expect(() => validateCustomFields(mockCustomFields, {})).to.throw();
		});

		it('should NOT throw an error when a non-required custom field is missing', () => {
			const allowedCustomFields = [{ _id: 'field1', label: 'Field 1', required: false }];
			const customFields = {};

			expect(() => validateCustomFields(allowedCustomFields, customFields)).not.to.throw();
		});

		it('should throw an error if a custom field value does not match the regexp', () => {
			expect(() => validateCustomFields(mockCustomFields, { cf1: 'invalid' })).to.throw();
		});

		it('should handle an empty customFields input without throwing an error', () => {
			const allowedCustomFields = [{ _id: 'field1', label: 'Field 1', required: false }];
			const customFields = {};

			expect(() => validateCustomFields(allowedCustomFields, customFields)).not.to.throw();
		});

		it('should throw an error if a extra custom field is passed', () => {
			const allowedCustomFields = [{ _id: 'field1', label: 'Field 1', required: false }];
			const customFields = { field2: 'value' };

			expect(() => validateCustomFields(allowedCustomFields, customFields)).to.throw();
		});
	});

	describe('validateContactManager', () => {
		beforeEach(() => {
			modelsMock.Users.findOneAgentById.reset();
		});

		it('should throw an error if the user does not exist', async () => {
			modelsMock.Users.findOneAgentById.resolves(undefined);
			await expect(validateContactManager('any_id')).to.be.rejectedWith('error-contact-manager-not-found');
		});

		it('should not throw an error if the user has the "livechat-agent" role', async () => {
			const user = { _id: 'userId' };
			modelsMock.Users.findOneAgentById.resolves(user);

			await expect(validateContactManager('userId')).to.not.be.rejected;
			expect(modelsMock.Users.findOneAgentById.getCall(0).firstArg).to.be.equal('userId');
		});
	});

	describe('updateContact', () => {
		beforeEach(() => {
			modelsMock.LivechatContacts.findOneById.reset();
			modelsMock.LivechatContacts.updateContact.reset();
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
});

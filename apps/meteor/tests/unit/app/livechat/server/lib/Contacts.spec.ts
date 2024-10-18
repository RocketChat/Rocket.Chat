import type { ILivechatContact } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const modelsMock = {
	Users: {
		findOneAgentById: sinon.stub(),
		findOneByUsername: sinon.stub(),
	},
	LivechatContacts: {
		findOneById: sinon.stub(),
		insertOne: sinon.stub(),
		upsertContact: sinon.stub(),
		updateContact: sinon.stub(),
		findContactMatchingVisitor: sinon.stub(),
		findOneByVisitorId: sinon.stub(),
	},
	LivechatRooms: {
		findNewestByVisitorIdOrToken: sinon.stub(),
		setContactIdByVisitorIdOrToken: sinon.stub(),
	},
	LivechatVisitors: {
		findOneById: sinon.stub(),
		updateById: sinon.stub(),
		updateOne: sinon.stub(),
	},
	LivechatCustomField: {
		findByScope: sinon.stub(),
	},
};
const { validateCustomFields, validateContactManager, updateContact, getContact } = proxyquire
	.noCallThru()
	.load('../../../../../../app/livechat/server/lib/Contacts', {
		'meteor/check': sinon.stub(),
		'meteor/meteor': sinon.stub(),
		'@rocket.chat/models': modelsMock,
		'@rocket.chat/tools': { wrapExceptions: sinon.stub() },
		'./Helper': { validateEmail: sinon.stub() },
		'./LivechatTyped': {
			Livechat: {
				logger: {
					debug: sinon.stub(),
				},
			},
		},
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

	describe('getContact', () => {
		beforeEach(() => {
			modelsMock.LivechatContacts.findOneById.reset();
			modelsMock.LivechatContacts.upsertContact.reset();
			modelsMock.LivechatContacts.insertOne.reset();
			modelsMock.LivechatVisitors.findOneById.reset();
			modelsMock.LivechatVisitors.updateById.reset();
			modelsMock.Users.findOneByUsername.reset();
		});

		describe('contact not found', () => {
			it('should search for visitor when the contact is not found', async () => {
				modelsMock.LivechatContacts.findOneById.resolves(undefined);
				modelsMock.LivechatVisitors.findOneById.resolves(undefined);
				expect(await getContact('any_id')).to.be.null;

				expect(modelsMock.LivechatContacts.upsertContact.getCall(0)).to.be.null;
				expect(modelsMock.LivechatVisitors.updateById.getCall(0)).to.be.null;
				expect(modelsMock.LivechatVisitors.findOneById.getCall(0).args[0]).to.be.equal('any_id');
			});

			it('should create a contact if there is a visitor with that id', async () => {
				let createdContact: ILivechatContact | null = null;
				modelsMock.LivechatContacts.findOneById.callsFake(() => createdContact);
				modelsMock.Users.findOneByUsername.resolves({ _id: 'manager_id' });
				modelsMock.LivechatCustomField.findByScope.returns({ toArray: () => [] });
				modelsMock.LivechatVisitors.findOneById.resolves({
					_id: 'any_id',
					contactManager: { username: 'username' },
					name: 'VisitorName',
					username: 'VisitorUsername',
					visitorEmails: [{ address: 'email@domain.com' }, { address: 'email2@domain.com' }],
					phone: [{ phoneNumber: '1' }, { phoneNumber: '2' }],
				});

				modelsMock.LivechatContacts.upsertContact.callsFake((contactId, data) => {
					createdContact = {
						...data,
						_id: contactId,
					};
				});
				modelsMock.LivechatContacts.insertOne.callsFake((data) => {
					createdContact = {
						...data,
						_id: 'random_id',
					};
					return {
						insertedId: 'random_id',
					};
				});
				modelsMock.LivechatRooms.findNewestByVisitorIdOrToken.resolves({
					_id: 'room_id',
					visitorId: 'any_id',
					source: {
						type: 'widget',
					},
				});

				expect(await getContact('any_id')).to.be.deep.equal({
					_id: 'any_id',
					name: 'VisitorName',
					emails: [{ address: 'email@domain.com' }, { address: 'email2@domain.com' }],
					phones: [{ phoneNumber: '1' }, { phoneNumber: '2' }],
					contactManager: 'manager_id',
					unknown: true,
					channels: [
						{
							name: 'widget',
							visitorId: 'any_id',
							blocked: false,
							verified: false,
							details: { type: 'widget' },
						},
					],
					customFields: {},
				});

				expect(modelsMock.LivechatContacts.findOneById.getCall(0).args[0]).to.be.equal('any_id');
				expect(modelsMock.LivechatContacts.findOneById.getCall(0).returnValue).to.be.equal(null);
				expect(modelsMock.LivechatContacts.findOneById.getCall(1).args[0]).to.be.equal('any_id');
				expect(modelsMock.LivechatContacts.findOneById.getCall(1).returnValue).to.be.equal(createdContact);

				expect(modelsMock.LivechatContacts.insertOne.getCall(0)).to.be.null;
				expect(modelsMock.Users.findOneByUsername.getCall(0).args[0]).to.be.equal('username');
			});
		});

		describe('contact found', () => {
			it('should not search for visitor data.', async () => {
				modelsMock.LivechatContacts.findOneById.resolves({ _id: 'any_id' });

				expect(await getContact('any_id')).to.be.deep.equal({ _id: 'any_id' });

				expect(modelsMock.LivechatVisitors.findOneById.getCall(0)).to.be.null;
				expect(modelsMock.LivechatContacts.insertOne.getCall(0)).to.be.null;
				expect(modelsMock.LivechatContacts.upsertContact.getCall(0)).to.be.null;
			});
		});
	});
});

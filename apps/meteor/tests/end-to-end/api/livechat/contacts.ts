import { faker } from '@faker-js/faker';
import type { ILivechatAgent, ILivechatVisitor, IOmnichannelRoom, IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { before, after, describe, it } from 'mocha';

import { getCredentials, api, request, credentials } from '../../../data/api-data';
import { createCustomField, deleteCustomField } from '../../../data/livechat/custom-fields';
import {
	closeOmnichannelRoom,
	createAgent,
	createLivechatRoom,
	createLivechatRoomWidget,
	createVisitor,
	deleteVisitor,
} from '../../../data/livechat/rooms';
import { removeAgent } from '../../../data/livechat/users';
import { removePermissionFromAllRoles, restorePermissionToRoles, updatePermission, updateSetting } from '../../../data/permissions.helper';
import { createUser, deleteUser } from '../../../data/users.helper';

describe('LIVECHAT - contacts', () => {
	let agentUser: IUser;
	let livechatAgent: ILivechatAgent;
	before((done) => getCredentials(done));

	before(async () => {
		await updateSetting('Livechat_enabled', true);
		agentUser = await createUser();
		livechatAgent = await createAgent(agentUser.username);
	});

	after(async () => {
		await removeAgent(livechatAgent._id);
		await deleteUser(agentUser);
		await restorePermissionToRoles('create-livechat-contact');
		await updateSetting('Livechat_enabled', true);
	});

	describe('[POST] omnichannel/contacts', () => {
		before(async () => {
			await updatePermission('create-livechat-contact', ['admin']);
		});

		after(async () => {
			await restorePermissionToRoles('create-livechat-contact');
		});

		it('should be able to create a new contact', async () => {
			const res = await request
				.post(api('omnichannel/contacts'))
				.set(credentials)
				.send({
					name: faker.person.fullName(),
					emails: [faker.internet.email().toLowerCase()],
					phones: [faker.phone.number()],
				});

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('contactId');
			expect(res.body.contactId).to.be.an('string');
		});

		it("should return an error if user doesn't have 'create-livechat-contact' permission", async () => {
			await removePermissionFromAllRoles('create-livechat-contact');

			const res = await request
				.post(api('omnichannel/contacts'))
				.set(credentials)
				.send({
					name: faker.person.fullName(),
					emails: [faker.internet.email().toLowerCase()],
					phones: [faker.phone.number()],
				});

			expect(res.body).to.have.property('success', false);
			expect(res.body.error).to.be.equal('User does not have the permissions required for this action [error-unauthorized]');

			await restorePermissionToRoles('create-livechat-contact');
		});

		it('should return an error if contact manager not exists', async () => {
			const res = await request
				.post(api('omnichannel/contacts'))
				.set(credentials)
				.send({
					name: faker.person.fullName(),
					emails: [faker.internet.email().toLowerCase()],
					phones: [faker.phone.number()],
					contactManager: 'invalid',
				});

			expect(res.body).to.have.property('success', false);
			expect(res.body).to.have.property('error');
			expect(res.body.error).to.be.equal('error-contact-manager-not-found');
		});

		it('should return an error if contact manager is not a livechat-agent', async () => {
			const normalUser = await createUser();

			const res = await request
				.post(api('omnichannel/contacts'))
				.set(credentials)
				.send({
					name: faker.person.fullName(),
					emails: [faker.internet.email().toLowerCase()],
					phones: [faker.phone.number()],
					contactManager: normalUser._id,
				});

			expect(res.body).to.have.property('success', false);
			expect(res.body).to.have.property('error');
			expect(res.body.error).to.be.equal('error-contact-manager-not-found');

			await deleteUser(normalUser);
		});

		it('should be able to create a new contact with a contact manager', async () => {
			const res = await request
				.post(api('omnichannel/contacts'))
				.set(credentials)
				.send({
					name: faker.person.fullName(),
					emails: [faker.internet.email().toLowerCase()],
					phones: [faker.phone.number()],
					contactManager: livechatAgent._id,
				});

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('contactId');
			expect(res.body.contactId).to.be.an('string');
		});

		describe('Custom Fields', () => {
			before(async () => {
				await createCustomField({
					field: 'cf1',
					label: 'Custom Field 1',
					scope: 'visitor',
					visibility: 'public',
					type: 'input',
					required: true,
					regexp: '^[0-9]+$',
					searchable: true,
					public: true,
				});
			});

			after(async () => {
				await deleteCustomField('cf1');
			});

			it('should validate custom fields correctly', async () => {
				const res = await request
					.post(api('omnichannel/contacts'))
					.set(credentials)
					.send({
						name: faker.person.fullName(),
						emails: [faker.internet.email().toLowerCase()],
						phones: [faker.phone.number()],
						customFields: {
							cf1: '123',
						},
					});

				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.property('contactId');
				expect(res.body.contactId).to.be.an('string');
			});

			it('should return an error for missing required custom field', async () => {
				const res = await request
					.post(api('omnichannel/contacts'))
					.set(credentials)
					.send({
						name: faker.person.fullName(),
						emails: [faker.internet.email().toLowerCase()],
						phones: [faker.phone.number()],
						customFields: {},
					});

				expect(res.body).to.have.property('success', false);
				expect(res.body).to.have.property('error');
				expect(res.body.error).to.be.equal('Invalid value for Custom Field 1 field');
			});

			it('should return an error for invalid custom field value', async () => {
				const res = await request
					.post(api('omnichannel/contacts'))
					.set(credentials)
					.send({
						name: faker.person.fullName(),
						emails: [faker.internet.email().toLowerCase()],
						phones: [faker.phone.number()],
						customFields: {
							cf1: 'invalid',
						},
					});

				expect(res.body).to.have.property('success', false);
				expect(res.body).to.have.property('error');
				expect(res.body.error).to.be.equal('Invalid value for Custom Field 1 field');
			});
		});

		describe('Fields Validation', () => {
			it('should return an error if name is missing', async () => {
				const res = await request
					.post(api('omnichannel/contacts'))
					.set(credentials)
					.send({
						emails: [faker.internet.email().toLowerCase()],
						phones: [faker.phone.number()],
					});

				expect(res.body).to.have.property('success', false);
				expect(res.body).to.have.property('error');
				expect(res.body.error).to.be.equal("must have required property 'name' [invalid-params]");
				expect(res.body.errorType).to.be.equal('invalid-params');
			});

			it('should return an error if emails is missing', async () => {
				const res = await request
					.post(api('omnichannel/contacts'))
					.set(credentials)
					.send({
						name: faker.person.fullName(),
						phones: [faker.phone.number()],
					});

				expect(res.body).to.have.property('success', false);
				expect(res.body).to.have.property('error');
				expect(res.body.error).to.be.equal("must have required property 'emails' [invalid-params]");
				expect(res.body.errorType).to.be.equal('invalid-params');
			});

			it('should return an error if phones is missing', async () => {
				const res = await request
					.post(api('omnichannel/contacts'))
					.set(credentials)
					.send({
						name: faker.person.fullName(),
						emails: [faker.internet.email().toLowerCase()],
					});

				expect(res.body).to.have.property('success', false);
				expect(res.body).to.have.property('error');
				expect(res.body.error).to.be.equal("must have required property 'phones' [invalid-params]");
				expect(res.body.errorType).to.be.equal('invalid-params');
			});

			it('should return an error if emails is not an array', async () => {
				const res = await request
					.post(api('omnichannel/contacts'))
					.set(credentials)
					.send({
						name: faker.person.fullName(),
						emails: 'invalid',
						phones: [faker.phone.number()],
					});

				expect(res.body).to.have.property('success', false);
				expect(res.body).to.have.property('error');
				expect(res.body.error).to.be.equal('must be array [invalid-params]');
				expect(res.body.errorType).to.be.equal('invalid-params');
			});

			it('should return an error if emails is not an array of strings', async () => {
				const res = await request
					.post(api('omnichannel/contacts'))
					.set(credentials)
					.send({
						name: faker.person.fullName(),
						emails: [{ invalid: true }],
						phones: [faker.phone.number()],
					});

				expect(res.body).to.have.property('success', false);
				expect(res.body).to.have.property('error');
				expect(res.body.error).to.be.equal('must be string [invalid-params]');
				expect(res.body.errorType).to.be.equal('invalid-params');
			});

			it('should return an error if phones is not an array of strings', async () => {
				const res = await request
					.post(api('omnichannel/contacts'))
					.set(credentials)
					.send({
						name: faker.person.fullName(),
						emails: [faker.internet.email().toLowerCase()],
						phones: [{ invalid: true }],
					});

				expect(res.body).to.have.property('success', false);
				expect(res.body).to.have.property('error');
				expect(res.body.error).to.be.equal('must be string [invalid-params]');
				expect(res.body.errorType).to.be.equal('invalid-params');
			});

			it('should return an error if additional fields are provided', async () => {
				const res = await request
					.post(api('omnichannel/contacts'))
					.set(credentials)
					.send({
						name: faker.person.fullName(),
						emails: [faker.internet.email().toLowerCase()],
						phones: [faker.phone.number()],
						additional: 'invalid',
					});

				expect(res.body).to.have.property('success', false);
				expect(res.body).to.have.property('error');
				expect(res.body.error).to.be.equal('must NOT have additional properties [invalid-params]');
				expect(res.body.errorType).to.be.equal('invalid-params');
			});
		});
	});

	describe('[POST] omnichannel/contacts.update', () => {
		let contactId: string;

		before(async () => {
			const { body } = await request
				.post(api('omnichannel/contacts'))
				.set(credentials)
				.send({
					name: faker.person.fullName(),
					emails: [faker.internet.email().toLowerCase()],
					phones: [faker.phone.number()],
				});
			contactId = body.contactId;
		});

		after(async () => {
			await restorePermissionToRoles('update-livechat-contact');
		});

		it('should be able to update a contact', async () => {
			const name = faker.person.fullName();
			const emails = [faker.internet.email().toLowerCase()];
			const phones = [faker.phone.number()];

			const res = await request.post(api('omnichannel/contacts.update')).set(credentials).send({
				contactId,
				name,
				emails,
				phones,
			});

			expect(res.status).to.be.equal(200);
			expect(res.body).to.have.property('success', true);
			expect(res.body.contact._id).to.be.equal(contactId);
			expect(res.body.contact.name).to.be.equal(name);
			expect(res.body.contact.emails).to.be.deep.equal([
				{
					address: emails[0],
				},
			]);
			expect(res.body.contact.phones).to.be.deep.equal([
				{
					phoneNumber: phones[0],
				},
			]);
		});

		it('should set the unknown field to false when updating a contact', async () => {
			const res = await request.post(api('omnichannel/contacts.update')).set(credentials).send({
				contactId,
				name: faker.person.fullName(),
			});

			expect(res.status).to.be.equal(200);
			expect(res.body).to.have.property('success', true);
			expect(res.body.contact._id).to.be.equal(contactId);
			expect(res.body.contact.unknown).to.be.equal(false);
		});

		it('should be able to update the contact manager', async () => {
			const res = await request.post(api('omnichannel/contacts.update')).set(credentials).send({
				contactId,
				contactManager: livechatAgent._id,
			});

			expect(res.status).to.be.equal(200);
			expect(res.body).to.have.property('success', true);
			expect(res.body.contact._id).to.be.equal(contactId);
			expect(res.body.contact.contactManager).to.be.equal(livechatAgent._id);
		});

		it('should return an error if contact does not exist', async () => {
			const res = await request
				.post(api('omnichannel/contacts.update'))
				.set(credentials)
				.send({
					contactId: 'invalid',
					name: faker.person.fullName(),
					emails: [faker.internet.email().toLowerCase()],
					phones: [faker.phone.number()],
				});

			expect(res.body).to.have.property('success', false);
			expect(res.body).to.have.property('error');
			expect(res.body.error).to.be.equal('error-contact-not-found');
		});

		it('should return an error if contact manager not exists', async () => {
			const res = await request.post(api('omnichannel/contacts.update')).set(credentials).send({
				contactId,
				contactManager: 'invalid',
			});

			expect(res.body).to.have.property('success', false);
			expect(res.body).to.have.property('error');
			expect(res.body.error).to.be.equal('error-contact-manager-not-found');
		});

		describe('Permissions', () => {
			before(async () => {
				await removePermissionFromAllRoles('update-livechat-contact');
			});

			after(async () => {
				await restorePermissionToRoles('update-livechat-contact');
			});

			it("should return an error if user doesn't have 'update-livechat-contact' permission", async () => {
				const res = await request.post(api('omnichannel/contacts.update')).set(credentials).send({
					contactId,
				});

				expect(res.body).to.have.property('success', false);
				expect(res.body).to.have.property('error');
				expect(res.body.error).to.be.equal('User does not have the permissions required for this action [error-unauthorized]');
			});
		});

		describe('Custom Fields', () => {
			before(async () => {
				await createCustomField({
					field: 'cf1',
					label: 'Custom Field 1',
					scope: 'visitor',
					visibility: 'public',
					type: 'input',
					required: true,
					regexp: '^[0-9]+$',
					searchable: true,
					public: true,
				});
			});

			after(async () => {
				await deleteCustomField('cf1');
			});

			it('should validate custom fields correctly', async () => {
				const res = await request
					.post(api('omnichannel/contacts.update'))
					.set(credentials)
					.send({
						contactId,
						customFields: {
							cf1: '123',
						},
					});

				expect(res.status).to.be.equal(200);
				expect(res.body).to.have.property('success', true);
				expect(res.body.contact._id).to.be.equal(contactId);
			});

			it('should return an error for invalid custom field value', async () => {
				const res = await request
					.post(api('omnichannel/contacts.update'))
					.set(credentials)
					.send({
						contactId,
						customFields: {
							cf1: 'invalid',
						},
					});

				expect(res.body).to.have.property('success', false);
				expect(res.body).to.have.property('error');
				expect(res.body.error).to.be.equal('Invalid value for Custom Field 1 field');
			});

			it('should return an error if additional custom fields are provided', async () => {
				const res = await request
					.post(api('omnichannel/contacts.update'))
					.set(credentials)
					.send({
						contactId,
						customFields: {
							cf1: '123',
							cf2: 'invalid',
						},
					});

				expect(res.body).to.have.property('success', false);
				expect(res.body).to.have.property('error');
				expect(res.body.error).to.be.equal('Custom field cf2 is not allowed');
			});
		});

		describe('Fields Validation', () => {
			it('should return an error if contactId is missing', async () => {
				const res = await request
					.post(api('omnichannel/contacts.update'))
					.set(credentials)
					.send({
						emails: [faker.internet.email().toLowerCase()],
						phones: [faker.phone.number()],
					});

				expect(res.body).to.have.property('success', false);
				expect(res.body).to.have.property('error');
				expect(res.body.error).to.be.equal("must have required property 'contactId' [invalid-params]");
				expect(res.body.errorType).to.be.equal('invalid-params');
			});

			it('should return an error if emails is not an array', async () => {
				const res = await request.post(api('omnichannel/contacts.update')).set(credentials).send({
					contactId,
					emails: 'invalid',
				});

				expect(res.body).to.have.property('success', false);
				expect(res.body).to.have.property('error');
				expect(res.body.error).to.be.equal('must be array [invalid-params]');
				expect(res.body.errorType).to.be.equal('invalid-params');
			});

			it('should return an error if emails is not an array of strings', async () => {
				const res = await request
					.post(api('omnichannel/contacts.update'))
					.set(credentials)
					.send({
						contactId,
						emails: [{ invalid: true }],
					});

				expect(res.body).to.have.property('success', false);
				expect(res.body).to.have.property('error');
				expect(res.body.error).to.be.equal('must be string [invalid-params]');
				expect(res.body.errorType).to.be.equal('invalid-params');
			});

			it('should return an error if phones is not an array', async () => {
				const res = await request.post(api('omnichannel/contacts.update')).set(credentials).send({
					contactId,
					phones: 'invalid',
				});

				expect(res.body).to.have.property('success', false);
				expect(res.body).to.have.property('error');
				expect(res.body.error).to.be.equal('must be array [invalid-params]');
				expect(res.body.errorType).to.be.equal('invalid-params');
			});

			it('should return an error if phones is not an array of strings', async () => {
				const res = await request
					.post(api('omnichannel/contacts.update'))
					.set(credentials)
					.send({
						contactId,
						phones: [{ invalid: true }],
					});

				expect(res.body).to.have.property('success', false);
				expect(res.body).to.have.property('error');
				expect(res.body.error).to.be.equal('must be string [invalid-params]');
				expect(res.body.errorType).to.be.equal('invalid-params');
			});

			it('should return an error if additional fields are provided', async () => {
				const res = await request.post(api('omnichannel/contacts.update')).set(credentials).send({
					contactId,
					unknown: true,
				});

				expect(res.body).to.have.property('success', false);
				expect(res.body).to.have.property('error');
				expect(res.body.error).to.be.equal('must NOT have additional properties [invalid-params]');
				expect(res.body.errorType).to.be.equal('invalid-params');
			});
		});
	});

	describe('[GET] omnichannel/contacts.get', () => {
		let contactId: string;
		const contact = {
			name: faker.person.fullName(),
			emails: [faker.internet.email().toLowerCase()],
			phones: [faker.phone.number()],
			contactManager: agentUser?._id,
		};

		before(async () => {
			await updatePermission('view-livechat-contact', ['admin']);
			const { body } = await request
				.post(api('omnichannel/contacts'))
				.set(credentials)
				.send({ ...contact });
			contactId = body.contactId;
		});

		after(async () => {
			await restorePermissionToRoles('view-livechat-contact');
		});

		it('should be able get a contact by id', async () => {
			const res = await request.get(api(`omnichannel/contacts.get`)).set(credentials).query({ contactId });

			expect(res.status).to.be.equal(200);
			expect(res.body).to.have.property('success', true);
			expect(res.body.contact).to.have.property('createdAt');
			expect(res.body.contact._id).to.be.equal(contactId);
			expect(res.body.contact.name).to.be.equal(contact.name);
			expect(res.body.contact.emails).to.be.deep.equal([
				{
					address: contact.emails[0],
				},
			]);
			expect(res.body.contact.phones).to.be.deep.equal([{ phoneNumber: contact.phones[0] }]);
			expect(res.body.contact.contactManager).to.be.equal(contact.contactManager);
		});

		it('should return null if contact does not exist', async () => {
			const res = await request.get(api(`omnichannel/contacts.get`)).set(credentials).query({ contactId: 'invalid' });

			expect(res.status).to.be.equal(200);
			expect(res.body).to.have.property('success', true);
			expect(res.body.contact).to.be.null;
		});

		it("should return an error if user doesn't have 'view-livechat-contact' permission", async () => {
			await removePermissionFromAllRoles('view-livechat-contact');

			const res = await request.get(api(`omnichannel/contacts.get`)).set(credentials).query({ contactId });

			expect(res.body).to.have.property('success', false);
			expect(res.body.error).to.be.equal('User does not have the permissions required for this action [error-unauthorized]');

			await restorePermissionToRoles('view-livechat-contact');
		});

		it('should return an error if contactId is missing', async () => {
			const res = await request.get(api(`omnichannel/contacts.get`)).set(credentials);

			expect(res.body).to.have.property('success', false);
			expect(res.body).to.have.property('error');
			expect(res.body.error).to.be.equal("must have required property 'contactId' [invalid-params]");
			expect(res.body.errorType).to.be.equal('invalid-params');
		});

		describe('Last Chat', () => {
			let visitor: ILivechatVisitor;
			let room: IOmnichannelRoom;

			before(async () => {
				visitor = await createVisitor();
				room = await createLivechatRoom(visitor.token);
			});

			after(async () => {
				await closeOmnichannelRoom(room._id);
				await deleteVisitor(visitor._id);
			});

			it('should return the last chat', async () => {
				const res = await request.get(api(`omnichannel/contacts.get`)).set(credentials).query({ contactId: visitor.contactId });

				expect(res.status).to.be.equal(200);
				expect(res.body).to.have.property('success', true);
				expect(res.body.contact).to.have.property('lastChat');
				expect(res.body.contact.lastChat).to.have.property('ts');
				expect(res.body.contact.lastChat._id).to.be.equal(room._id);
			});

			it('should not return the last chat if contact never chatted', async () => {
				const res = await request.get(api(`omnichannel/contacts.get`)).set(credentials).query({ contactId });

				expect(res.status).to.be.equal(200);
				expect(res.body).to.have.property('success', true);
				expect(res.body.contact).to.have.property('_id', contactId);
				expect(res.body.contact).to.not.have.property('lastChat');
			});
		});
	});

	describe('[GET] omnichannel/contacts.search', () => {
		let contactId: string;
		const contact = {
			name: faker.person.fullName(),
			emails: [faker.internet.email().toLowerCase()],
			phones: [faker.phone.number()],
			contactManager: agentUser?._id,
		};

		before(async () => {
			await updatePermission('view-livechat-contact', ['admin']);
			const { body } = await request.post(api('omnichannel/contacts')).set(credentials).send(contact);
			contactId = body.contactId;
		});

		after(async () => {
			await restorePermissionToRoles('view-livechat-contact');
		});

		it('should be able to list all contacts', async () => {
			const res = await request.get(api(`omnichannel/contacts.search`)).set(credentials);

			expect(res.status).to.be.equal(200);
			expect(res.body).to.have.property('success', true);
			expect(res.body.contacts).to.be.an('array');
			expect(res.body.contacts.length).to.be.greaterThan(0);
			expect(res.body.count).to.be.an('number');
			expect(res.body.total).to.be.an('number');
			expect(res.body.offset).to.be.an('number');
		});

		it('should return only contacts that match the searchText using email', async () => {
			const res = await request.get(api(`omnichannel/contacts.search`)).set(credentials).query({ searchText: contact.emails[0] });
			expect(res.status).to.be.equal(200);
			expect(res.body).to.have.property('success', true);
			expect(res.body.contacts).to.be.an('array');
			expect(res.body.contacts.length).to.be.equal(1);
			expect(res.body.total).to.be.equal(1);
			expect(res.body.contacts[0]._id).to.be.equal(contactId);
			expect(res.body.contacts[0].name).to.be.equal(contact.name);
			expect(res.body.contacts[0].emails[0].address).to.be.equal(contact.emails[0]);
		});

		it('should return only contacts that match the searchText using phone number', async () => {
			const res = await request.get(api(`omnichannel/contacts.search`)).set(credentials).query({ searchText: contact.phones[0] });
			expect(res.status).to.be.equal(200);
			expect(res.body).to.have.property('success', true);
			expect(res.body.contacts).to.be.an('array');
			expect(res.body.contacts.length).to.be.equal(1);
			expect(res.body.total).to.be.equal(1);
			expect(res.body.contacts[0]._id).to.be.equal(contactId);
			expect(res.body.contacts[0].name).to.be.equal(contact.name);
			expect(res.body.contacts[0].phones[0].phoneNumber).to.be.equal(contact.phones[0]);
		});

		it('should return only contacts that match the searchText using name', async () => {
			const res = await request.get(api(`omnichannel/contacts.search`)).set(credentials).query({ searchText: contact.name });
			expect(res.status).to.be.equal(200);
			expect(res.body).to.have.property('success', true);
			expect(res.body.contacts).to.be.an('array');
			expect(res.body.contacts.length).to.be.equal(1);
			expect(res.body.total).to.be.equal(1);
			expect(res.body.contacts[0]._id).to.be.equal(contactId);
			expect(res.body.contacts[0].name).to.be.equal(contact.name);
			expect(res.body.contacts[0].emails[0].address).to.be.equal(contact.emails[0]);
		});

		it('should return an empty list if no contacts exist', async () => {
			const res = await request.get(api(`omnichannel/contacts.search`)).set(credentials).query({ searchText: 'invalid' });
			expect(res.status).to.be.equal(200);
			expect(res.body).to.have.property('success', true);
			expect(res.body.contacts).to.be.an('array');
			expect(res.body.contacts.length).to.be.equal(0);
			expect(res.body.total).to.be.equal(0);
		});

		describe('Permissions', () => {
			before(async () => {
				await removePermissionFromAllRoles('view-livechat-contact');
			});

			after(async () => {
				await restorePermissionToRoles('view-livechat-contact');
			});

			it("should return an error if user doesn't have 'view-livechat-contact' permission", async () => {
				const res = await request.get(api(`omnichannel/contacts.search`)).set(credentials);

				expect(res.body).to.have.property('success', false);
				expect(res.body.error).to.be.equal('User does not have the permissions required for this action [error-unauthorized]');
			});
		});
	});

	describe('Contact Channels', () => {
		let visitor: ILivechatVisitor;

		beforeEach(async () => {
			visitor = await createVisitor();
		});

		afterEach(async () => {
			await deleteVisitor(visitor.token);
		});

		it('should add a channel to a contact when creating a new room', async () => {
			await request.get(api('livechat/room')).query({ token: visitor.token });

			const res = await request.get(api(`omnichannel/contacts.get`)).set(credentials).query({ contactId: visitor.contactId });

			expect(res.status).to.be.equal(200);
			expect(res.body).to.have.property('success', true);
			expect(res.body.contact.channels).to.be.an('array');
			expect(res.body.contact.channels.length).to.be.equal(1);
			expect(res.body.contact.channels[0].name).to.be.equal('api');
			expect(res.body.contact.channels[0].verified).to.be.false;
			expect(res.body.contact.channels[0].blocked).to.be.false;
			expect(res.body.contact.channels[0].visitorId).to.be.equal(visitor._id);
		});

		it('should not add a channel if visitor already has one with same type', async () => {
			const roomResult = await request.get(api('livechat/room')).query({ token: visitor.token });

			const res = await request.get(api(`omnichannel/contacts.get`)).set(credentials).query({ contactId: visitor.contactId });

			expect(res.status).to.be.equal(200);
			expect(res.body).to.have.property('success', true);
			expect(res.body.contact.channels).to.be.an('array');
			expect(res.body.contact.channels.length).to.be.equal(1);

			await closeOmnichannelRoom(roomResult.body.room._id);
			await request.get(api('livechat/room')).query({ token: visitor.token });

			const secondResponse = await request.get(api(`omnichannel/contacts.get`)).set(credentials).query({ contactId: visitor.contactId });

			expect(secondResponse.status).to.be.equal(200);
			expect(secondResponse.body).to.have.property('success', true);
			expect(secondResponse.body.contact.channels).to.be.an('array');
			expect(secondResponse.body.contact.channels.length).to.be.equal(1);
		});
	});

	describe('[GET] omnichannel/contacts.history', () => {
		let visitor: ILivechatVisitor;
		let room1: IOmnichannelRoom;
		let room2: IOmnichannelRoom;

		before(async () => {
			visitor = await createVisitor();
			room1 = await createLivechatRoom(visitor.token);
			await closeOmnichannelRoom(room1._id);
			room2 = await createLivechatRoomWidget(visitor.token);
		});

		after(async () => {
			await closeOmnichannelRoom(room2._id);
			await deleteVisitor(visitor._id);
		});

		it('should be able to list a contact history', async () => {
			const res = await request.get(api(`omnichannel/contacts.history`)).set(credentials).query({ contactId: visitor.contactId });

			expect(res.status).to.be.equal(200);
			expect(res.body).to.have.property('success', true);
			expect(res.body.history).to.be.an('array');
			expect(res.body.history.length).to.be.equal(2);
			expect(res.body.total).to.be.equal(2);
			expect(res.body.count).to.be.an('number');
			expect(res.body.offset).to.be.an('number');

			expect(res.body.history[0]).to.have.property('_id', room2._id);
			expect(res.body.history[0]).to.not.have.property('closedAt');
			expect(res.body.history[0]).to.have.property('fname', visitor.name);
			expect(res.body.history[0].source).to.have.property('type', 'widget');

			expect(res.body.history[1]).to.have.property('_id', room1._id);
			expect(res.body.history[1]).to.have.property('closedAt');
			expect(res.body.history[1]).to.have.property('closedBy');
			expect(res.body.history[1]).to.have.property('closer', 'user');
			expect(res.body.history[1].source).to.have.property('type', 'api');
		});

		it('should be able to filter a room by the source', async () => {
			const res = await request
				.get(api(`omnichannel/contacts.history`))
				.set(credentials)
				.query({ contactId: visitor.contactId, source: 'api' });

			expect(res.status).to.be.equal(200);
			expect(res.body).to.have.property('success', true);
			expect(res.body.history).to.be.an('array');
			expect(res.body.history.length).to.be.equal(1);
			expect(res.body.total).to.be.equal(1);
			expect(res.body.count).to.be.an('number');
			expect(res.body.offset).to.be.an('number');
			expect(res.body.history[0].source).to.have.property('type', 'api');
		});

		it('should return an empty list if contact does not have history', async () => {
			const emptyVisitor = await createVisitor();
			const res = await request.get(api(`omnichannel/contacts.history`)).set(credentials).query({ contactId: emptyVisitor.contactId });

			expect(res.status).to.be.equal(200);
			expect(res.body).to.have.property('success', true);
			expect(res.body.history).to.be.an('array');
			expect(res.body.history.length).to.be.equal(0);
			expect(res.body.total).to.be.equal(0);

			await deleteVisitor(emptyVisitor.token);
		});

		it('should return an error if contacts not exists', async () => {
			const res = await request.get(api(`omnichannel/contacts.history`)).set(credentials).query({ contactId: 'invalid' });

			expect(res.status).to.be.equal(400);
			expect(res.body).to.have.property('success', false);
			expect(res.body.error).to.be.equal('error-contact-not-found');
		});
	});
});

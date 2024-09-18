import { faker } from '@faker-js/faker';
import type { ILivechatAgent, IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { before, after, describe, it } from 'mocha';

import { getCredentials, api, request, credentials } from '../../../data/api-data';
import { createCustomField, deleteCustomField } from '../../../data/livechat/custom-fields';
import { createAgent } from '../../../data/livechat/rooms';
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
			expect(res.body.contact.emails).to.be.deep.equal(emails);
			expect(res.body.contact.phones).to.be.deep.equal(phones);
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
			expect(res.body.contact._id).to.be.equal(contactId);
			expect(res.body.contact.name).to.be.equal(contact.name);
			expect(res.body.contact.emails).to.be.deep.equal(contact.emails);
			expect(res.body.contact.phones).to.be.deep.equal(contact.phones);
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
	});
});

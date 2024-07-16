import { faker } from '@faker-js/faker';
import { expect } from 'chai';
import { before, after, describe, it } from 'mocha';

import { getCredentials, api, request, credentials } from '../../../data/api-data';
import { createCustomField, deleteCustomField } from '../../../data/livechat/custom-fields';
import { createAgent } from '../../../data/livechat/rooms';
import { removePermissionFromAllRoles, restorePermissionToRoles, updatePermission, updateSetting } from '../../../data/permissions.helper';
import { createUser, deleteUser } from '../../../data/users.helper';

describe('LIVECHAT - contacts', () => {
	before((done) => getCredentials(done));

	before(async () => {
		await updateSetting('Livechat_enabled', true);
		await updatePermission('create-livechat-contact', ['admin']);
	});

	after(async () => {
		await restorePermissionToRoles('create-livechat-contact');
		await updateSetting('Livechat_enabled', true);
	});

	describe('[POST] omnichannel/contacts', () => {
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
			const user = await createUser();
			const livechatAgent = await createAgent(user.username);

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

			await deleteUser(user);
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
});

import { faker } from '@faker-js/faker';
import type { Credentials } from '@rocket.chat/api-client';
import type {
	ILivechatAgent,
	ILivechatVisitor,
	IOmnichannelRoom,
	IUser,
	ILivechatContactVisitorAssociation,
} from '@rocket.chat/core-typings';
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
	fetchInquiry,
	getLivechatRoomInfo,
	startANewLivechatRoomAndTakeIt,
} from '../../../data/livechat/rooms';
import { createAnOnlineAgent, removeAgent } from '../../../data/livechat/users';
import { removePermissionFromAllRoles, restorePermissionToRoles, updatePermission, updateSetting } from '../../../data/permissions.helper';
import { createUser, deleteUser } from '../../../data/users.helper';
import { expectInvalidParams } from '../../../data/validation.helper';
import { IS_EE } from '../../../e2e/config/constants';

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
			let contactId: string;
			before(async () => {
				const defaultProps = {
					scope: 'visitor' as const,
					visibility: 'public',
					type: 'input',
					regexp: '^[0-9]+$',
					searchable: true,
					public: true,
				};

				await Promise.all([
					createCustomField({
						...defaultProps,
						field: 'cf1',
						label: 'Custom Field 1',
						required: true,
					}),
					createCustomField({
						...defaultProps,
						field: 'cf2',
						label: 'Custom Field 2',
						required: false,
					}),
					createCustomField({
						...defaultProps,
						field: 'cfOptional',
						label: 'Optional Custom Field',
						required: false,
					}),
				]);
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

			it('should keep a legacy custom field, but not update it, nor throw an error if it is specified on update', async () => {
				const createRes = await request
					.post(api('omnichannel/contacts'))
					.set(credentials)
					.send({
						name: faker.person.fullName(),
						emails: [faker.internet.email().toLowerCase()],
						phones: [faker.phone.number()],
						customFields: {
							cf1: '123',
							cf2: '456',
						},
					});
				expect(createRes.body).to.have.property('success', true);
				expect(createRes.body).to.have.property('contactId').that.is.a('string');
				contactId = createRes.body.contactId;

				await deleteCustomField('cf2');

				const updateRes = await request
					.post(api('omnichannel/contacts.update'))
					.set(credentials)
					.send({
						contactId,
						customFields: {
							cf1: '456',
							cf2: '789',
						},
					});
				expect(updateRes.body).to.have.property('success', true);
				expect(updateRes.body).to.have.property('contact').that.is.an('object');
				expect(updateRes.body.contact).to.have.property('_id', contactId);
				expect(updateRes.body.contact).to.have.property('customFields').that.is.an('object');
				expect(updateRes.body.contact.customFields).to.have.property('cf1', '456');
				expect(updateRes.body.contact.customFields).to.have.property('cf2', '456');
			});

			it('should keep a legacy custom field and not throw an error if it is not specified on update', async () => {
				const updateRes = await request
					.post(api('omnichannel/contacts.update'))
					.set(credentials)
					.send({
						contactId,
						customFields: {
							cf1: '789',
							cfOptional: '567',
						},
					});
				expect(updateRes.body).to.have.property('success', true);
				expect(updateRes.body).to.have.property('contact').that.is.an('object');
				expect(updateRes.body.contact).to.have.property('_id', contactId);
				expect(updateRes.body.contact).to.have.property('customFields').that.is.an('object');
				expect(updateRes.body.contact.customFields).to.have.property('cf1', '789');
				expect(updateRes.body.contact.customFields).to.have.property('cfOptional', '567');
				expect(updateRes.body.contact.customFields).to.have.property('cf2', '456');
			});

			it('should keep a legacy custom field, but remove an optional registered custom field if it is not specified on update', async () => {
				const updateRes = await request
					.post(api('omnichannel/contacts.update'))
					.set(credentials)
					.send({
						contactId,
						customFields: {
							cf1: '789',
						},
					});
				expect(updateRes.body).to.have.property('success', true);
				expect(updateRes.body).to.have.property('contact').that.is.an('object');
				expect(updateRes.body.contact).to.have.property('_id', contactId);
				expect(updateRes.body.contact).to.have.property('customFields').that.is.an('object');
				expect(updateRes.body.contact.customFields).to.have.property('cf1', '789');
				expect(updateRes.body.contact.customFields).to.have.property('cf2', '456');
				expect(updateRes.body.contact.customFields).to.not.have.property('cfOptional');
			});

			it('should throw an error if trying to update a custom field that is not registered in the workspace and does not exist in the contact', async () => {
				const updateRes = await request
					.post(api('omnichannel/contacts.update'))
					.set(credentials)
					.send({
						contactId,
						customFields: {
							cf1: '123',
							cf3: 'invalid',
						},
					});
				expect(updateRes.body).to.have.property('success', false);
				expect(updateRes.body).to.have.property('error');
				expect(updateRes.body.error).to.be.equal('Custom field cf3 is not allowed');
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

	describe('Contact Rooms', () => {
		let agent: { credentials: Credentials; user: IUser & { username: string } };

		before(async () => {
			await updatePermission('view-livechat-contact', ['admin']);
			agent = await createAnOnlineAgent();
		});

		after(async () => {
			await restorePermissionToRoles('view-livechat-contact');
			await deleteUser(agent.user);
		});

		it('should create a contact and assign it to the room', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			expect(room).to.have.property('contactId').that.is.a('string');
		});

		it('should create a room using the pre-created contact', async () => {
			const email = faker.internet.email().toLowerCase();
			const phone = faker.phone.number();

			const contact = {
				name: 'Contact Name',
				emails: [email],
				phones: [phone],
				contactManager: agentUser?._id,
			};

			const { body } = await request
				.post(api('omnichannel/contacts'))
				.set(credentials)
				.send({ ...contact });
			const { contactId } = body;

			const visitor = await createVisitor(undefined, 'Visitor Name', email, phone);

			const room = await createLivechatRoom(visitor.token);

			expect(room).to.have.property('contactId', contactId);
			expect(room).to.have.property('fname', 'Contact Name');
		});

		it('should update room names when a contact name changes', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			expect(room).to.have.property('contactId').that.is.a('string');
			expect(room.fname).to.not.be.equal('New Contact Name');

			const res = await request.post(api('omnichannel/contacts.update')).set(credentials).send({
				contactId: room.contactId,
				name: 'New Contact Name',
			});

			expect(res.status).to.be.equal(200);

			const sameRoom = await createLivechatRoom(visitor.token, { rid: room._id });
			expect(sameRoom._id).to.be.equal(room._id);
			expect(sameRoom.fname).to.be.equal('New Contact Name');
		});

		it('should update room subscriptions when a contact name changes', async () => {
			const response = await startANewLivechatRoomAndTakeIt({ agent: agent.credentials });
			const { room, visitor } = response;
			const newName = faker.person.fullName();

			expect(room).to.have.property('contactId').that.is.a('string');
			expect(room.fname).to.be.equal(visitor.name);

			const res = await request.post(api('omnichannel/contacts.update')).set(credentials).send({
				contactId: room.contactId,
				name: newName,
			});

			expect(res.status).to.be.equal(200);

			const sameRoom = await createLivechatRoom(visitor.token, { rid: room._id });
			expect(sameRoom._id).to.be.equal(room._id);
			expect(sameRoom.fname).to.be.equal(newName);

			const subscriptionResponse = await request
				.get(api('subscriptions.getOne'))
				.set(agent.credentials)
				.query({ roomId: room._id })
				.expect('Content-Type', 'application/json');
			const { subscription } = subscriptionResponse.body;
			expect(subscription).to.have.property('v').that.is.an('object');
			expect(subscription.v).to.have.property('_id', visitor._id);
			expect(subscription).to.have.property('name', newName);
			expect(subscription).to.have.property('fname', newName);
		});

		it('should update inquiry when a contact name changes', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			expect(room).to.have.property('contactId').that.is.a('string');
			expect(room.fname).to.not.be.equal('New Contact Name');

			const res = await request.post(api('omnichannel/contacts.update')).set(credentials).send({
				contactId: room.contactId,
				name: 'Edited Contact Name Inquiry',
			});
			expect(res.status).to.be.equal(200);

			const roomInquiry = await fetchInquiry(room._id);
			expect(roomInquiry).to.have.property('name', 'Edited Contact Name Inquiry');
		});
	});

	describe('[GET] omnichannel/contacts.get', () => {
		let contactId: string;
		let contactId2: string;

		const email = faker.internet.email().toLowerCase();
		const phone = faker.phone.number();

		const contact = {
			name: faker.person.fullName(),
			emails: [email],
			phones: [phone],
			contactManager: agentUser?._id,
		};

		before(async () => {
			await updatePermission('view-livechat-contact', ['admin']);
			const { body } = await request
				.post(api('omnichannel/contacts'))
				.set(credentials)
				.send({ ...contact });
			contactId = body.contactId;

			const { body: contact2Body } = await request
				.post(api('omnichannel/contacts'))
				.set(credentials)
				.send({
					name: faker.person.fullName(),
					emails: [faker.internet.email().toLowerCase()],
					phones: [faker.phone.number()],
					contactManager: agentUser?._id,
				});
			contactId2 = contact2Body.contactId;

			const visitor = await createVisitor(undefined, contact.name, email, phone);

			await createLivechatRoom(visitor.token);
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

		it('should return 404 if contact does not exist using contactId', async () => {
			const res = await request.get(api(`omnichannel/contacts.get`)).set(credentials).query({ contactId: 'invalid' });

			expect(res.status).to.be.equal(404);
			expect(res.body).to.have.property('success', false);
			expect(res.body).to.have.property('error', 'Resource not found');
		});

		it("should return an error if user doesn't have 'view-livechat-contact' permission", async () => {
			await removePermissionFromAllRoles('view-livechat-contact');

			const res = await request.get(api(`omnichannel/contacts.get`)).set(credentials).query({ contactId });

			expect(res.body).to.have.property('success', false);
			expect(res.body.error).to.be.equal('User does not have the permissions required for this action [error-unauthorized]');

			await restorePermissionToRoles('view-livechat-contact');
		});

		it('should return an error if contactId and visitor association is missing', async () => {
			const res = await request.get(api(`omnichannel/contacts.get`)).set(credentials);

			expectInvalidParams(res, ["must have required property 'contactId' [invalid-params]"]);
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
				const room = await createLivechatRoom(visitor.token);

				expect(room.contactId).to.be.a('string');

				const res = await request.get(api(`omnichannel/contacts.get`)).set(credentials).query({ contactId: room.contactId });

				expect(res.status).to.be.equal(200);
				expect(res.body).to.have.property('success', true);
				expect(res.body.contact.channels).to.be.an('array');
				expect(res.body.contact.channels.length).to.be.equal(1);
				expect(res.body.contact.channels[0].name).to.be.equal('api');
				expect(res.body.contact.channels[0].verified).to.be.false;
				expect(res.body.contact.channels[0].blocked).to.be.false;
				expect(res.body.contact.channels[0].visitor)
					.to.be.an('object')
					.that.is.deep.equal({
						visitorId: visitor._id,
						source: {
							type: 'api',
						},
					});
			});

			it('should not add a channel if visitor already has one with same type', async () => {
				const room = await createLivechatRoom(visitor.token);

				const res = await request.get(api(`omnichannel/contacts.get`)).set(credentials).query({ contactId: room.contactId });

				expect(res.status).to.be.equal(200);
				expect(res.body).to.have.property('success', true);
				expect(res.body.contact.channels).to.be.an('array');
				expect(res.body.contact.channels.length).to.be.equal(1);

				await closeOmnichannelRoom(room._id);
				await request.get(api('livechat/room')).query({ token: visitor.token });

				const secondResponse = await request.get(api(`omnichannel/contacts.get`)).set(credentials).query({ contactId: room.contactId });

				expect(secondResponse.status).to.be.equal(200);
				expect(secondResponse.body).to.have.property('success', true);
				expect(secondResponse.body.contact.channels).to.be.an('array');
				expect(secondResponse.body.contact.channels.length).to.be.equal(1);
			});
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

			it('should have assigned a contactId to the new room', async () => {
				expect(room.contactId).to.be.a('string');
			});

			it('should return the last chat', async () => {
				const res = await request.get(api(`omnichannel/contacts.get`)).set(credentials).query({ contactId: room.contactId });

				expect(res.status).to.be.equal(200);
				expect(res.body).to.have.property('success', true);
				expect(res.body.contact).to.have.property('lastChat');
				expect(res.body.contact.lastChat).to.have.property('ts');
				expect(res.body.contact.lastChat._id).to.be.equal(room._id);
				expect(res.body.contact.channels[0].lastChat).to.have.property('ts');
				expect(res.body.contact.channels[0].lastChat._id).to.be.equal(room._id);
			});

			it('should not return the last chat if contact never chatted', async () => {
				const res = await request.get(api(`omnichannel/contacts.get`)).set(credentials).query({ contactId: contactId2 });

				expect(res.status).to.be.equal(200);
				expect(res.body).to.have.property('success', true);
				expect(res.body.contact).to.have.property('_id', contactId2);
				expect(res.body.contact).to.not.have.property('lastChat');
			});
		});
	});

	describe('[GET] omnichannel/contacts.checkExistence', () => {
		let contactId: string;
		let roomId: string;

		const email = faker.internet.email().toLowerCase();
		const phone = faker.phone.number();

		const contact = {
			name: faker.person.fullName(),
			emails: [email],
			phones: [phone],
			contactManager: agentUser?._id,
		};

		before(async () => {
			await updatePermission('view-livechat-contact', ['admin']);
			const { body } = await request
				.post(api('omnichannel/contacts'))
				.set(credentials)
				.send({ ...contact });
			contactId = body.contactId;

			const visitor = await createVisitor(undefined, contact.name, email, phone);

			const room = await createLivechatRoom(visitor.token);
			roomId = room._id;
		});

		after(async () => Promise.all([restorePermissionToRoles('view-livechat-contact'), closeOmnichannelRoom(roomId)]));

		it('should confirm a contact exists when checking by contact id', async () => {
			const res = await request.get(api(`omnichannel/contacts.checkExistence`)).set(credentials).query({ contactId });

			expect(res.status).to.be.equal(200);
			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('exists', true);
		});

		it('should confirm a contact does not exist when checking by contact id', async () => {
			const res = await request.get(api(`omnichannel/contacts.checkExistence`)).set(credentials).query({ contactId: 'invalid-contact-id' });

			expect(res.status).to.be.equal(200);
			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('exists', false);
		});

		it('should confirm a contact exists when checking by email', async () => {
			const res = await request.get(api(`omnichannel/contacts.checkExistence`)).set(credentials).query({ email });

			expect(res.status).to.be.equal(200);
			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('exists', true);
		});

		it('should confirm a contact does not exist when checking by email', async () => {
			const res = await request
				.get(api(`omnichannel/contacts.checkExistence`))
				.set(credentials)
				.query({ email: 'invalid-email@example.com' });

			expect(res.status).to.be.equal(200);
			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('exists', false);
		});

		it('should confirm a contact exists when checking by phone', async () => {
			const res = await request.get(api(`omnichannel/contacts.checkExistence`)).set(credentials).query({ phone });

			expect(res.status).to.be.equal(200);
			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('exists', true);
		});

		it('should confirm a contact does not exist when checking by phone', async () => {
			const res = await request.get(api(`omnichannel/contacts.checkExistence`)).set(credentials).query({ phone: 'invalid-phone' });

			expect(res.status).to.be.equal(200);
			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('exists', false);
		});

		it("should return an error if user doesn't have 'view-livechat-contact' permission", async () => {
			await removePermissionFromAllRoles('view-livechat-contact');

			const res = await request.get(api(`omnichannel/contacts.checkExistence`)).set(credentials).query({ contactId });

			expect(res.body).to.have.property('success', false);
			expect(res.body.error).to.be.equal('User does not have the permissions required for this action [error-unauthorized]');

			await restorePermissionToRoles('view-livechat-contact');
		});

		it('should return an error if all query params are missing', async () => {
			const res = await request.get(api(`omnichannel/contacts.checkExistence`)).set(credentials);

			expectInvalidParams(res, [
				"must have required property 'contactId'",
				"must have required property 'email'",
				"must have required property 'phone'",
				'must match exactly one schema in oneOf [invalid-params]',
			]);
		});

		it('should return an error if more than one field is provided', async () => {
			const res = await request.get(api(`omnichannel/contacts.checkExistence`)).set(credentials).query({ contactId, email, phone });

			expectInvalidParams(res, [
				'must NOT have additional properties',
				'must NOT have additional properties',
				'must NOT have additional properties',
				'must match exactly one schema in oneOf [invalid-params]',
			]);
		});
	});

	describe('[GET] omnichannel/contacts.search', () => {
		let contactId: string;
		let visitor: ILivechatVisitor;
		let room: IOmnichannelRoom;
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
			visitor = await createVisitor();
			room = await createLivechatRoom(visitor.token);
		});

		after(async () => {
			await restorePermissionToRoles('view-livechat-contact');
			await closeOmnichannelRoom(room._id);
			await deleteVisitor(visitor._id);
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

		it('should return only known contacts by default', async () => {
			const res = await request.get(api(`omnichannel/contacts.search`)).set(credentials);

			expect(res.status).to.be.equal(200);
			expect(res.body).to.have.property('success', true);
			expect(res.body.contacts).to.be.an('array');
			expect(res.body.contacts[0].unknown).to.be.false;
		});

		it('should be able to filter contacts by unknown field', async () => {
			const res = await request.get(api(`omnichannel/contacts.search`)).set(credentials).query({ unknown: true });

			expect(res.status).to.be.equal(200);
			expect(res.body).to.have.property('success', true);
			expect(res.body.contacts).to.be.an('array');
			expect(res.body.contacts[0].unknown).to.be.true;
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
			const res = await request.get(api(`omnichannel/contacts.history`)).set(credentials).query({ contactId: room1.contactId });

			expect(res.status).to.be.equal(200);
			expect(res.body).to.have.property('success', true);
			expect(res.body.history).to.be.an('array');
			expect(res.body.history.length).to.be.equal(1);
			expect(res.body.total).to.be.equal(1);
			expect(res.body.count).to.be.an('number');
			expect(res.body.offset).to.be.an('number');

			expect(res.body.history[0]).to.have.property('_id', room1._id);
			expect(res.body.history[0]).to.have.property('closedAt');
			expect(res.body.history[0]).to.have.property('closedBy');
			expect(res.body.history[0]).to.have.property('closer', 'user');
			expect(res.body.history[0].source).to.have.property('type', 'api');
		});

		it('should be able to filter a room by the source', async () => {
			const res = await request
				.get(api(`omnichannel/contacts.history`))
				.set(credentials)
				.query({ contactId: room1.contactId, source: 'api' });

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
			const { body } = await request
				.post(api('omnichannel/contacts'))
				.set(credentials)
				.send({
					name: faker.person.fullName(),
					emails: [faker.internet.email().toLowerCase()],
					phones: [faker.phone.number()],
				});

			const res = await request.get(api(`omnichannel/contacts.history`)).set(credentials).query({ contactId: body.contactId });

			expect(res.status).to.be.equal(200);
			expect(res.body).to.have.property('success', true);
			expect(res.body.history).to.be.an('array');
			expect(res.body.history.length).to.be.equal(0);
			expect(res.body.total).to.be.equal(0);
		});

		it('should return an error if contacts not exists', async () => {
			const res = await request.get(api(`omnichannel/contacts.history`)).set(credentials).query({ contactId: 'invalid' });

			expect(res.status).to.be.equal(400);
			expect(res.body).to.have.property('success', false);
			expect(res.body.error).to.be.equal('error-contact-not-found');
		});
	});

	describe('[GET] omnichannel/contacts.channels', () => {
		let contactId: string;
		let visitor: ILivechatVisitor;
		let room: IOmnichannelRoom;

		before(async () => {
			await updatePermission('view-livechat-contact', ['admin']);
			visitor = await createVisitor();
			room = await createLivechatRoom(visitor.token);
			await closeOmnichannelRoom(room._id);
			contactId = room.contactId as string;
		});

		after(async () => {
			await deleteVisitor(visitor._id);
			await restorePermissionToRoles('view-livechat-contact');
		});

		it('should be able get the channels of a contact by his id', async () => {
			const res = await request.get(api(`omnichannel/contacts.channels`)).set(credentials).query({ contactId });

			expect(res.status).to.be.equal(200);
			expect(res.body).to.have.property('success', true);
			expect(res.body.channels).to.be.an('array');
			expect(res.body.channels.length).to.be.equal(1);
			expect(res.body.channels[0]).to.have.property('name', 'api');
			expect(res.body.channels[0])
				.to.have.property('visitor')
				.that.is.an('object')
				.and.deep.equal({
					visitorId: visitor._id,
					source: {
						type: 'api',
					},
				});
			expect(res.body.channels[0]).to.have.property('verified', false);
			expect(res.body.channels[0]).to.have.property('blocked', false);
			expect(res.body.channels[0]).to.have.property('lastChat');
		});

		it('should return an empty array if contact does not have channels', async () => {
			const { body } = await request
				.post(api('omnichannel/contacts'))
				.set(credentials)
				.send({ name: faker.person.fullName(), emails: [faker.internet.email().toLowerCase()], phones: [faker.phone.number()] });
			const res = await request.get(api(`omnichannel/contacts.channels`)).set(credentials).query({ contactId: body.contactId });

			expect(res.status).to.be.equal(200);
			expect(res.body).to.have.property('success', true);
			expect(res.body.channels).to.be.an('array');
			expect(res.body.channels.length).to.be.equal(0);
		});

		it('should return an empty array if contact does not exist', async () => {
			const res = await request.get(api(`omnichannel/contacts.channels`)).set(credentials).query({ contactId: 'invalid' });

			expect(res.status).to.be.equal(200);
			expect(res.body).to.have.property('success', true);
			expect(res.body.channels).to.be.an('array');
			expect(res.body.channels.length).to.be.equal(0);
		});

		it("should return an error if user doesn't have 'view-livechat-contact' permission", async () => {
			await removePermissionFromAllRoles('view-livechat-contact');

			const res = await request.get(api(`omnichannel/contacts.channels`)).set(credentials).query({ contactId });

			expect(res.body).to.have.property('success', false);
			expect(res.body.error).to.be.equal('User does not have the permissions required for this action [error-unauthorized]');

			await restorePermissionToRoles('view-livechat-contact');
		});

		it('should return an error if contactId is missing', async () => {
			const res = await request.get(api(`omnichannel/contacts.channels`)).set(credentials);

			expect(res.body).to.have.property('success', false);
			expect(res.body).to.have.property('error');
			expect(res.body.error).to.be.equal("must have required property 'contactId' [invalid-params]");
			expect(res.body.errorType).to.be.equal('invalid-params');
		});
	});

	(IS_EE ? describe : describe.skip)('[POST] omnichannel/contacts.block', async () => {
		let visitor: ILivechatVisitor;
		let room: IOmnichannelRoom;
		let association: ILivechatContactVisitorAssociation;

		before(async () => {
			visitor = await createVisitor();
			room = await createLivechatRoom(visitor.token);

			association = {
				visitorId: visitor._id,
				source: {
					type: room.source.type,
					id: room.source.id,
				},
			};
		});

		after(async () => {
			await deleteVisitor(visitor.token);
		});

		it('should be able to block a contact channel', async () => {
			const res = await request.post(api('omnichannel/contacts.block')).set(credentials).send({ visitor: association });

			expect(res.status).to.be.equal(200);
			expect(res.body).to.have.property('success', true);

			const { body } = await request.get(api('omnichannel/contacts.get')).set(credentials).query({ contactId: room.contactId });

			expect(body.contact.channels).to.be.an('array');
			expect(body.contact.channels.length).to.be.equal(1);
			expect(body.contact.channels[0].blocked).to.be.true;
		});

		it('should return an error if contact does not exist', async () => {
			const res = await request
				.post(api('omnichannel/contacts.block'))
				.set(credentials)
				.send({ visitor: { ...association, visitorId: 'invalid' } });

			expect(res.status).to.be.equal(400);
			expect(res.body).to.have.property('success', false);
			expect(res.body.error).to.be.equal('error-contact-not-found');
		});

		it('should return an error if contact does not exist 2', async () => {
			const res = await request
				.post(api('omnichannel/contacts.block'))
				.set(credentials)
				.send({ visitor: { ...association, source: { type: 'sms' } } });

			expect(res.status).to.be.equal(400);
			expect(res.body).to.have.property('success', false);
			expect(res.body.error).to.be.equal('error-contact-not-found');
		});

		it('should close room when contact is blocked', async () => {
			const res = await request.post(api('omnichannel/contacts.block')).set(credentials).send({ visitor: association });

			expect(res.status).to.be.equal(200);
			expect(res.body).to.have.property('success', true);

			const closedRoom = await getLivechatRoomInfo(room._id);

			expect(closedRoom).to.have.property('closedAt');
			expect(closedRoom).to.have.property('closedBy');
			expect(closedRoom.lastMessage?.msg).to.be.equal('This channel has been blocked');
		});

		it('should not be able to open a room when contact is blocked', async () => {
			await request.post(api('omnichannel/contacts.block')).set(credentials).send({ visitor: association });

			const createRoomResponse = await request.get(api('livechat/room')).query({ token: visitor.token }).set(credentials);

			expect(createRoomResponse.status).to.be.equal(400);
			expect(createRoomResponse.body).to.have.property('success', false);
			expect(createRoomResponse.body).to.have.property('error', 'error-contact-channel-blocked');
		});

		it('should return an error if visitor is missing', async () => {
			const res = await request.post(api('omnichannel/contacts.block')).set(credentials).send({});

			expect(res.status).to.be.equal(400);
			expect(res.body).to.have.property('success', false);
			expect(res.body.error).to.be.equal("must have required property 'visitor' [invalid-params]");
		});

		it('should return an error if visitorId is missing', async () => {
			const res = await request
				.post(api('omnichannel/contacts.block'))
				.set(credentials)
				.send({ visitor: { source: association.source } });

			expect(res.status).to.be.equal(400);
			expect(res.body).to.have.property('success', false);
			expect(res.body.error).to.be.equal("must have required property 'visitorId' [invalid-params]");
		});

		it('should return an error if source is missing', async () => {
			const res = await request
				.post(api('omnichannel/contacts.block'))
				.set(credentials)
				.send({ visitor: { visitorId: association.visitorId } });

			expect(res.status).to.be.equal(400);
			expect(res.body).to.have.property('success', false);
			expect(res.body.error).to.be.equal("must have required property 'source' [invalid-params]");
		});

		it('should return an error if source type is missing', async () => {
			const res = await request
				.post(api('omnichannel/contacts.block'))
				.set(credentials)
				.send({ visitor: { visitorId: association.visitorId, source: { id: association.source.id } } });

			expect(res.status).to.be.equal(400);
			expect(res.body).to.have.property('success', false);
			expect(res.body.error).to.be.equal("must have required property 'type' [invalid-params]");
		});

		describe('Permissions', () => {
			before(async () => {
				await removePermissionFromAllRoles('block-livechat-contact');
			});

			after(async () => {
				await restorePermissionToRoles('block-livechat-contact');
			});

			it("should return an error if user doesn't have 'block-livechat-contact' permission", async () => {
				const res = await request.post(api('omnichannel/contacts.block')).set(credentials).send({ visitor: association });

				expect(res.body).to.have.property('success', false);
				expect(res.body.error).to.be.equal('User does not have the permissions required for this action [error-unauthorized]');
			});
		});
	});

	(IS_EE ? describe : describe.skip)('[POST] omnichannel/contacts.unblock', async () => {
		let visitor: ILivechatVisitor;
		let room: IOmnichannelRoom;
		let association: ILivechatContactVisitorAssociation;

		before(async () => {
			visitor = await createVisitor();
			room = await createLivechatRoom(visitor.token);
			await closeOmnichannelRoom(room._id);
			association = { visitorId: visitor._id, source: { type: room.source.type, id: room.source.id } };
		});

		after(async () => {
			await deleteVisitor(visitor.token);
		});

		it('should be able to unblock a contact channel', async () => {
			await request.post(api('omnichannel/contacts.block')).set(credentials).send({ visitor: association });

			const { body } = await request.get(api('omnichannel/contacts.get')).set(credentials).query({ contactId: room.contactId });

			expect(body.contact.channels).to.be.an('array');
			expect(body.contact.channels.length).to.be.equal(1);
			expect(body.contact.channels[0].blocked).to.be.true;

			const res = await request.post(api('omnichannel/contacts.unblock')).set(credentials).send({ visitor: association });

			expect(res.status).to.be.equal(200);
			expect(res.body).to.have.property('success', true);

			const { body: body2 } = await request.get(api('omnichannel/contacts.get')).set(credentials).query({ contactId: room.contactId });

			expect(body2.contact.channels).to.be.an('array');
			expect(body2.contact.channels.length).to.be.equal(1);
			expect(body2.contact.channels[0].blocked).to.be.false;
		});

		it('should return an error if contact does not exist', async () => {
			const res = await request
				.post(api('omnichannel/contacts.block'))
				.set(credentials)
				.send({ visitor: { ...association, visitorId: 'invalid' } });

			expect(res.status).to.be.equal(400);
			expect(res.body).to.have.property('success', false);
			expect(res.body.error).to.be.equal('error-contact-not-found');
		});

		it('should return an error if contact does not exist 2', async () => {
			const res = await request
				.post(api('omnichannel/contacts.block'))
				.set(credentials)
				.send({ visitor: { ...association, source: { type: 'sms', id: room.source.id } } });

			expect(res.status).to.be.equal(400);
			expect(res.body).to.have.property('success', false);
			expect(res.body.error).to.be.equal('error-contact-not-found');
		});

		it('should return an error if visitor is missing', async () => {
			const res = await request.post(api('omnichannel/contacts.unblock')).set(credentials).send({});

			expect(res.status).to.be.equal(400);
			expect(res.body).to.have.property('success', false);
			expect(res.body.error).to.be.equal("must have required property 'visitor' [invalid-params]");
		});

		it('should return an error if visitorId is missing', async () => {
			const res = await request
				.post(api('omnichannel/contacts.unblock'))
				.set(credentials)
				.send({ visitor: { source: association.source } });

			expect(res.status).to.be.equal(400);
			expect(res.body).to.have.property('success', false);
			expect(res.body.error).to.be.equal("must have required property 'visitorId' [invalid-params]");
		});

		it('should return an error if source is missing', async () => {
			const res = await request
				.post(api('omnichannel/contacts.unblock'))
				.set(credentials)
				.send({ visitor: { visitorId: association.visitorId } });

			expect(res.status).to.be.equal(400);
			expect(res.body).to.have.property('success', false);
			expect(res.body.error).to.be.equal("must have required property 'source' [invalid-params]");
		});

		it('should return an error if source type is missing', async () => {
			const res = await request
				.post(api('omnichannel/contacts.unblock'))
				.set(credentials)
				.send({ visitor: { visitorId: association.visitorId, source: { id: association.source.id } } });

			expect(res.status).to.be.equal(400);
			expect(res.body).to.have.property('success', false);
			expect(res.body.error).to.be.equal("must have required property 'type' [invalid-params]");
		});

		describe('Permissions', () => {
			before(async () => {
				await removePermissionFromAllRoles('unblock-livechat-contact');
			});

			after(async () => {
				await restorePermissionToRoles('unblock-livechat-contact');
			});

			it("should return an error if user doesn't have 'unblock-livechat-contact' permission", async () => {
				const res = await request.post(api('omnichannel/contacts.unblock')).set(credentials).send({ visitor: association });

				expect(res.body).to.have.property('success', false);
				expect(res.body.error).to.be.equal('User does not have the permissions required for this action [error-unauthorized]');
			});
		});
	});
});

import { faker } from '@faker-js/faker';
import { expect } from 'chai';
import { before } from 'mocha';

import { getCredentials, api, request, credentials } from '../../../data/api-data';
import { removePermissionFromAllRoles, restorePermissionToRoles } from '../../../data/permissions.helper';
import { createUser } from '../../../data/users.helper';

describe('LIVECHAT - contacts', () => {
	before((done) => getCredentials(done));

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

		it("should return an error if user doesn't have view-l-room permission", async () => {
			await removePermissionFromAllRoles('view-l-room');

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

			await restorePermissionToRoles('view-l-room');
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
			expect(res.body.error).to.be.equal('No user found with id invalid [error-contact-manager-not-found]');
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
			expect(res.body.error).to.be.equal('The contact manager must have the role "livechat-agent" [error-invalid-contact-manager]');
		});
	});
});

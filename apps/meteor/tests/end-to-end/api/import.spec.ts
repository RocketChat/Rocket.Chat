import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';
import type { Response } from 'supertest';

import { getCredentials, api, request, credentials } from '../../data/api-data.js';
import { password } from '../../data/user';
import { createUser, login, deleteUser } from '../../data/users.helper.js';

describe('Imports', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	describe('[/getCurrentImportOperation]', () => {
		it('should return the current import operation', async () => {
			await request
				.get(api('getCurrentImportOperation'))
				.set(credentials)
				.expect(200)
				.expect((res: Response) => {
					expect(res.body.success).to.be.true;
					expect(res.body.operation).not.be.null;
				});
		});
	});
	describe('[/downloadPendingFiles]', () => {
		it('should return the number of pending files', async () => {
			await request
				.post(api('downloadPendingFiles'))
				.set(credentials)
				.expect(200)
				.expect((res: Response) => {
					expect(res.body.success).to.be.true;
					expect(res.body.count).to.be.greaterThanOrEqual(0);
				});
		});
	});
	describe('[/downloadPendingAvatars]', () => {
		it('should return the number of pending avatars', async () => {
			await request
				.post(api('downloadPendingAvatars'))
				.set(credentials)
				.expect(200)
				.expect((res: Response) => {
					expect(res.body.success).to.be.true;
					expect(res.body.count).to.be.greaterThanOrEqual(0);
				});
		});
	});
	describe('[/getLatestImportOperations]', () => {
		let testUser: any = {};
		before(async () => {
			testUser = await createUser();
		});
		let testCredentials: any = {};
		before(async () => {
			testCredentials = await login(testUser.username, password);
		});
		after(async () => {
			await deleteUser(testUser);
			testUser = undefined;
		});

		it('should fail if the user is not authorized', async () => {
			await request
				.get(api('getLatestImportOperations'))
				.set(testCredentials)
				.expect(403)
				.expect((res: Response) => {
					expect(res.body.success).to.be.false;
					expect(res.body.error).to.equal('User does not have the permissions required for this action [error-unauthorized]');
				});
		});

		it('should return the latest import operation', async () => {
			await request
				.get(api('getLatestImportOperations'))
				.set(credentials)
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.be.an('array');
				});
		});
	});

	describe('[/getImportProgress]', () => {
		it('should return the import progress', async () => {
			await request
				.get(api('getImportProgress'))
				.set(credentials)
				.expect(200)
				.expect((res: Response) => {
					expect(res.body.success).to.be.true;
					expect(res.body.key).to.be.an('string');
					expect(res.body.name).to.be.an('string');
					expect(res.body.step).to.be.an('string');
					expect(res.body.count).to.be.an('object');
				});
		});
	});

	describe('[/getImportFileData]', () => {
		it('should return the import file data', async () => {
			await request
				.get(api('getImportFileData'))
				.set(credentials)
				.expect(200)
				.expect((res: Response) => {
					expect(res.body.success).to.be.true;
					expect(res.body.users).to.be.an('array');
					expect(res.body.channels).to.be.an('array');
					expect(res.body.message_count).to.greaterThanOrEqual(0);
				});
		});
	});
});

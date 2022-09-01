import { expect } from 'chai';
import type { Response } from 'supertest';

import { getCredentials, api, request, credentials } from '../../data/api-data.js';
import { createUser, login, deleteUser } from '../../data/users.helper.js';
import { password } from '../../data/user.js';

describe('Imports', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	describe('[/getCurrentImportOperation]', () => {
		it('should return the current import operation', (done) => {
			request
				.get(api('getCurrentImportOperation'))
				.set(credentials)
				.expect(200)
				.expect((res: Response) => {
					expect(res.body.success).to.be.true;
					expect(res.body.operation).not.be.null;
				})
				.end(done);
		});
	});
	describe('[/downloadPendingFiles]', () => {
		it('should return the number of pending files', (done) => {
			request
				.post(api('downloadPendingFiles'))
				.set(credentials)
				.expect(200)
				.expect((res: Response) => {
					expect(res.body.success).to.be.true;
					expect(res.body.count).to.be.greaterThanOrEqual(0);
				})
				.end(done);
		});
	});
	describe('[/downloadPendingAvatars]', () => {
		it('should return the number of pending avatars', (done) => {
			request
				.post(api('downloadPendingAvatars'))
				.set(credentials)
				.expect(200)
				.expect((res: Response) => {
					expect(res.body.success).to.be.true;
					expect(res.body.count).to.be.greaterThanOrEqual(0);
				})
				.end(done);
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

		it('should fail if the user is not authorized', (done) => {
			request
				.get(api('getLatestImportOperations'))
				.set(testCredentials)
				.expect(403)
				.expect((res: Response) => {
					expect(res.body.success).to.be.false;
					expect(res.body.error).to.equal('User does not have the permissions required for this action [error-unauthorized]');
				})
				.end(done);
		});

		it('should return the latest import operation', (done) => {
			request
				.get(api('getLatestImportOperations'))
				.set(credentials)
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.be.an('array');
				})
				.end(done);
		});
	});

	describe('[/getImportProgress]', () => {
		it('should return the import progress', (done) => {
			request
				.get(api('getImportProgress'))
				.set(credentials)
				.expect(200)
				.expect((res: Response) => {
					expect(res.body.success).to.be.true;
					expect(res.body.key).to.be.an('string');
					expect(res.body.name).to.be.an('string');
					expect(res.body.step).to.be.an('string');
					expect(res.body.count).to.be.an('object');
				})
				.end(done);
		});
	});

	describe('[/getImportFileData]', () => {
		it('should return the import file data', (done) => {
			request
				.get(api('getImportFileData'))
				.set(credentials)
				.expect(200)
				.expect((res: Response) => {
					expect(res.body.success).to.be.true;
					expect(res.body.users).to.be.an('array');
					expect(res.body.channels).to.be.an('array');
					expect(res.body.message_count).to.greaterThanOrEqual(0);
				})
				.end(done);
		});
	});
});

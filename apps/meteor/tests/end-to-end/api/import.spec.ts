import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';
import type { Response } from 'supertest';

import { sleep } from '../../../lib/utils/sleep';
import { getCredentials, api, request, credentials } from '../../data/api-data';
import { mockServerHealthy, mockServerReset, mockServerSet } from '../../data/mock-server.helper';
import { getSettingValueById, updateSetting } from '../../data/permissions.helper';
import { password } from '../../data/user';
import { createUser, login, deleteUser } from '../../data/users.helper';
import { withTimeout } from '../../data/utils';

const IMPORT_MOCK_SERVER_URL = process.env.IMPORT_MOCK_SERVER_URL ?? 'http://mock-server.dev:8080';

describe('Imports', () => {
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

	describe('[/downloadPublicImportFile]', () => {
		let previousSsrfAllowlist: Awaited<ReturnType<typeof getSettingValueById>>;

		const waitForImportStep = (expectedStep: string): Promise<string> =>
			withTimeout(async (signal) => {
				let step = '';
				while (!signal.aborted) {
					const res = await request.get(api('getImportProgress')).set(credentials).expect(200);
					step = res.body.step;
					if (step === expectedStep || step === 'importer_import_failed') {
						return step;
					}
					await sleep(100);
				}
				return step;
			}, 10_000);

		before(async () => {
			expect(await mockServerHealthy(), 'mock-server is not reachable — ensure it is running').to.be.true;
			previousSsrfAllowlist = await getSettingValueById('SSRF_Allowlist');
			await Promise.all([mockServerReset(), updateSetting('SSRF_Allowlist', '')]);
		});

		after(async () => {
			await Promise.all([
				mockServerReset(),
				previousSsrfAllowlist !== undefined ? updateSetting('SSRF_Allowlist', previousSsrfAllowlist) : Promise.resolve(),
			]);
		});

		it('should reject a private target that is not on the SSRF allowlist and mark the operation as failed', async () => {
			await request
				.post(api('downloadPublicImportFile'))
				.set(credentials)
				.send({ fileUrl: 'http://127.0.0.1:3000/api/v1/info', importerKey: 'slack-users' })
				.expect(400)
				.expect((res: Response) => {
					expect(res.body.success).to.be.false;
					expect(res.body.error).to.equal('error-ssrf-validation-failed');
				});

			const progress = await request.get(api('getImportProgress')).set(credentials).expect(200);
			expect(progress.body.step).to.equal('importer_import_failed');
		});

		it('should download a file from an allowlisted private target', async () => {
			await Promise.all([
				mockServerSet('GET', '/import-test.zip', { marker: 'downloaded-by-server-fetch' }),
				updateSetting('SSRF_Allowlist', new URL(IMPORT_MOCK_SERVER_URL).host),
			]);

			await request
				.post(api('downloadPublicImportFile'))
				.set(credentials)
				.send({ fileUrl: `${IMPORT_MOCK_SERVER_URL}/import-test.zip`, importerKey: 'csv' })
				.expect(200)
				.expect((res: Response) => {
					expect(res.body.success).to.be.true;
				});

			expect(await waitForImportStep('importer_file_loaded')).to.equal('importer_file_loaded');
		});
	});

	describe('[/uploadImportFile]', () => {
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
				.post(api('uploadImportFile'))
				.set(testCredentials)
				.send({
					binaryContent: 'ZXJzLmNzdlBLBQYAAAAAAQABADcAAAAmAQAAAAA=',
					contentType: 'application/zip',
					fileName: 'users11.zip',
					importerKey: 'csv',
				})
				.expect(403)
				.expect((res: Response) => {
					expect(res.body.success).to.be.false;
					expect(res.body.error).to.equal('User does not have the permissions required for this action [error-unauthorized]');
				});
		});
	});
});

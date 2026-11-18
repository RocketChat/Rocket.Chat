import { after, before, describe, it } from 'node:test';

import type { Credentials } from '@rocket.chat/api-client';
import type { IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import type { Response } from 'supertest';

import { sleep } from '../../../lib/utils/sleep';
import { getCredentials, api, request, credentials } from '../../data/api-data';
import { mockServerHealthy, mockServerReset, mockServerSet } from '../../data/mock-server.helper';
import { getSettingValueById, updateSetting } from '../../data/permissions.helper';
import { password } from '../../data/user';
import type { TestUser } from '../../data/users.helper';
import { createUser, login, deleteUser } from '../../data/users.helper';
import { withTimeout } from '../../data/utils';

const IMPORT_MOCK_SERVER_URL = process.env.IMPORT_MOCK_SERVER_URL ?? 'http://mock-server.dev:8080';

describe('Imports', () => {
	before((_t, done) => getCredentials(done));

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
	describe('without run-import', () => {
		let user: TestUser<IUser>;
		let userCredentials: Credentials;

		before(async () => {
			user = await createUser();
			userCredentials = await login(user.username, password);
		});

		before(() =>
			withTimeout(async (signal) => {
				while (!signal.aborted) {
					const res = await request.get(api('getCurrentImportOperation')).set(credentials).expect(200);
					if (!['importer_preparing_started', 'importer_importing_files'].includes(res.body.operation?.status)) {
						return;
					}
					await sleep(100);
				}
			}, 10_000),
		);

		after(() => deleteUser(user));

		const readRoutes = ['getCurrentImportOperation', 'getImportProgress', 'getImportFileData', 'import.status'] as const;

		readRoutes.forEach((route) => {
			it(`should refuse ${route}`, async () => {
				await request.get(api(route)).set(userCredentials).expect(403);
			});
		});

		const actions = [
			['downloadPublicImportFile', { importerKey: 'csv', fileUrl: `${IMPORT_MOCK_SERVER_URL}/users.zip` }],
			['downloadPendingFiles', {}],
			['downloadPendingAvatars', {}],
			['import.addUsers', { users: [{ emails: ['refused@rocket.chat'], importIds: ['refused'] }] }],
			['startImport', { input: { users: { all: true } } }],
			['import.run', {}],
			['import.clear', {}],
		] as const;

		actions.forEach(([route, body]) => {
			it(`should refuse ${route} and keep the current operation`, async () => {
				const previous = await request.get(api('getCurrentImportOperation')).set(credentials).expect(200);

				await request.post(api(route)).set(userCredentials).send(body).expect(403);

				const current = await request.get(api('getCurrentImportOperation')).set(credentials).expect(200);
				expect(current.body.operation).to.deep.equal(previous.body.operation);
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
					expect(res.body.errorType).to.be.equal('error-forbidden');
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
					expect(res.body.errorType).to.be.equal('error-forbidden');
				});
		});
	});
});

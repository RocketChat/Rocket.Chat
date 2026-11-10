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

	describe('with the API importer', () => {
		const run = Date.now();
		const importUser = (name: string) => ({
			username: `import-${name}-${run}`,
			emails: [`import-${name}-${run}@example.com`],
			importIds: [`import-${name}-${run}`],
			name: `Imported ${name}`,
		});
		let regularUser: TestUser<IUser>;
		let regularCredentials: Credentials;

		const importStatus = async () => (await request.get(api('import.status')).set(credentials).expect(200)).body;
		const waitForImportState = (expectedState: string): Promise<string> =>
			withTimeout(async (signal) => {
				let state = '';
				while (!signal.aborted) {
					state = (await importStatus()).state;
					if (state === expectedState || state === 'error') {
						return state;
					}
					await sleep(100);
				}
				return state;
			}, 10_000);
		const findUser = async (username: string) =>
			(await request.get(api('users.info')).set(credentials).query({ username })).body.user as IUser | undefined;

		before(async () => {
			regularUser = await createUser();
			regularCredentials = await login(regularUser.username, password);
		});

		after(async () => {
			await request.post(api('import.clear')).set(credentials).expect(200);
			const imported = await Promise.all(['run', 'picked', 'skipped'].map((name) => findUser(importUser(name).username)));
			await Promise.all([deleteUser(regularUser), ...imported.filter((user) => user).map((user) => deleteUser(user as IUser))]);
		});

		describe('[/importers.list]', () => {
			it('should list the importers an admin can pick, without the API importer', async () => {
				const res = await request.get(api('importers.list')).set(credentials).expect(200);
				const keys = res.body.map(({ key }: { key: string }) => key);

				expect(keys).to.include.members(['csv', 'slack', 'slack-users']);
				expect(keys).to.not.include('api');
			});

			it('should fail if the user does not have the run-import permission', async () => {
				await request.get(api('importers.list')).set(regularCredentials).expect(403);
			});
		});

		describe('[/import.new]', () => {
			it('should start an API import operation that the status reports as new', async () => {
				const res = await request.post(api('import.new')).set(credentials).expect(200);

				expect(res.body.operation).to.include({ importerKey: 'api', status: 'importer_new', valid: true });
				const status = await importStatus();
				expect(status.state).to.equal('new');
				expect(status.operation._id).to.equal(res.body.operation._id);
			});

			it('should fail if the user does not have the run-import permission, and keep the current operation', async () => {
				const { operation } = await importStatus();

				await request.post(api('import.new')).set(regularCredentials).expect(403);

				expect((await importStatus()).operation._id).to.equal(operation._id);
			});
		});

		describe('[/import.addUsers]', () => {
			it('should fail if a user has no email, and add nobody', async () => {
				const res = await request
					.post(api('import.addUsers'))
					.set(credentials)
					.send({ users: [{ ...importUser('run'), emails: [] }] })
					.expect(400);

				expect(res.body.error).to.equal('Users are missing required data.');

				expect((await importStatus()).state).to.equal('new');
			});

			it('should add the users to the operation and make it ready to run', async () => {
				await request
					.post(api('import.addUsers'))
					.set(credentials)
					.send({ users: [importUser('run')] })
					.expect(200);

				const status = await importStatus();
				expect(status.state).to.equal('ready');
				expect(status.operation.count.users).to.equal(1);
			});
		});

		describe('[/import.run]', () => {
			it('should create every user added to the operation', async () => {
				await request.post(api('import.run')).set(credentials).expect(200);

				expect(await waitForImportState('done')).to.equal('done');
				expect(await findUser(importUser('run').username)).to.have.nested.property('emails[0].address', importUser('run').emails[0]);
			});
		});

		describe('[/import.clear]', () => {
			it('should end the current operation so it takes no more users', async () => {
				await request.post(api('import.new')).set(credentials).expect(200);

				await request.post(api('import.clear')).set(credentials).expect(200);

				expect((await importStatus()).operation.valid).to.be.false;
				const res = await request
					.post(api('import.addUsers'))
					.set(credentials)
					.send({ users: [importUser('skipped')] })
					.expect(400);
				expect(res.body.error).to.equal('Import operation not initialized.');
			});
		});

		describe('[/startImport]', () => {
			it('should create only the users picked from the operation', async () => {
				await request.post(api('import.new')).set(credentials).expect(200);
				await request
					.post(api('import.addUsers'))
					.set(credentials)
					.send({ users: [importUser('picked'), importUser('skipped')] })
					.expect(200);

				await request
					.post(api('startImport'))
					.set(credentials)
					.send({ input: { users: { list: importUser('picked').importIds } } })
					.expect(200);

				expect(await waitForImportState('done')).to.equal('done');
				expect(await findUser(importUser('picked').username)).to.have.property('username', importUser('picked').username);
				expect(await findUser(importUser('skipped').username)).to.be.undefined;
			});
		});
	});
});

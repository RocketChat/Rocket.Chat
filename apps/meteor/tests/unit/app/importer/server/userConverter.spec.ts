import type { IImportUser, IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import sinon from 'sinon';
import { vi } from 'vitest';

const {
	settingsStub,
	modelsMock,
	addUserToDefaultChannels,
	generateUsernameSuggestion,
	insertUserDoc,
	callbacks,
	bcryptHash,
	sha,
	generateTempPassword,
	stubs,
} = vi.hoisted(() => {
	const sinon = require('sinon');
	return {
		settingsStub: sinon.stub(),
		modelsMock: {
			Users: {
				findOneByEmailAddress: sinon.stub(),
				findOneByUsernameIgnoringCase: sinon.stub(),
				findOneById: sinon.stub(),
			},
		},
		addUserToDefaultChannels: sinon.stub(),
		generateUsernameSuggestion: sinon.stub(),
		insertUserDoc: sinon.stub(),
		callbacks: {
			run: sinon.stub(),
		},
		bcryptHash: sinon.stub(),
		sha: sinon.stub(),
		generateTempPassword: sinon.stub(),
		stubs: {
			saveUserIdentity: sinon.stub(),
			setUserActiveStatus: sinon.stub(),
			notifyOnUserChange: sinon.stub(),
		},
	};
});

vi.mock('../../../../../server/lib/callbacks', () => ({ callbacks }));
vi.mock('../../../../../app/settings/server', () => ({ settings: { get: settingsStub } }));
vi.mock('../../../../../app/lib/server/functions/addUserToDefaultChannels', () => ({ addUserToDefaultChannels }));
vi.mock('../../../../../app/lib/server/functions/getUsernameSuggestion', () => ({ generateUsernameSuggestion }));
vi.mock('../../../../../app/lib/server/functions/saveUserIdentity', () => ({ saveUserIdentity: stubs.saveUserIdentity }));
vi.mock('../../../../../app/lib/server/functions/setUserActiveStatus', () => ({ setUserActiveStatus: stubs.setUserActiveStatus }));
vi.mock('../../../../../app/lib/server/lib/notifyListener', () => ({ notifyOnUserChange: stubs.notifyOnUserChange }));
vi.mock('../../../../../app/importer/server/classes/converters/generateTempPassword', () => ({ generateTempPassword }));
vi.mock('bcrypt', () => ({ hash: bcryptHash }));
vi.mock('@rocket.chat/sha256', () => ({ SHA256: sha }));
vi.mock('meteor/accounts-base', () => ({ Accounts: { insertUserDoc, _bcryptRounds: () => 10 } }));
vi.mock('@rocket.chat/models', () => modelsMock);

const { UserConverter } = await import('../../../../../app/importer/server/classes/converters/UserConverter');

describe('User Converter', () => {
	beforeEach(() => {
		modelsMock.Users.findOneByEmailAddress.reset();
		modelsMock.Users.findOneByUsernameIgnoringCase.reset();
		modelsMock.Users.findOneById.reset();
		callbacks.run.reset();
		insertUserDoc.reset();
		addUserToDefaultChannels.reset();
		generateUsernameSuggestion.reset();
		settingsStub.reset();
	});

	const userToImport = {
		name: 'user1',
		emails: ['user1@domain.com'],
		importIds: ['importId1'],
		username: 'username1',
	} as unknown as IImportUser;

	describe('[findExistingUser]', () => {
		it('function should be called by the converter', async () => {
			const converter = new UserConverter({ workInMemory: true });
			const findExistingUser = sinon.stub(converter, 'findExistingUser');

			findExistingUser.throws();

			await converter.addObject(userToImport);
			await converter.convertData();

			expect(findExistingUser.getCall(0)).to.not.be.null;
			expect(callbacks.run.getCall(0)).to.not.be.null;
			expect(callbacks.run.getCall(0).args).to.be.deep.equal(['afterUserImport', { inserted: [], updated: [], skipped: 0, failed: 1 }]);
		});

		it('should search by email address', async () => {
			const converter = new UserConverter({ workInMemory: true });

			await converter.findExistingUser(userToImport);
			expect(modelsMock.Users.findOneByEmailAddress.getCalls()).to.be.an('array').with.lengthOf(1);
			expect(modelsMock.Users.findOneByEmailAddress.getCall(0).args).to.be.an('array').that.contains('user1@domain.com');
		});

		it('should search by username', async () => {
			const converter = new UserConverter({ workInMemory: true });

			await converter.findExistingUser(userToImport);
			expect(modelsMock.Users.findOneByUsernameIgnoringCase.getCalls()).to.be.an('array').with.lengthOf(1);
			expect(modelsMock.Users.findOneByUsernameIgnoringCase.getCall(0).args).to.be.an('array').that.contains('username1');
		});

		it('should not search by username if an user is found by email', async () => {
			const converter = new UserConverter({ workInMemory: true });

			modelsMock.Users.findOneByEmailAddress.resolves(userToImport);

			await converter.findExistingUser(userToImport);
			expect(modelsMock.Users.findOneByUsernameIgnoringCase.getCall(0)).to.be.null;
		});
	});

	describe('[buildNewUserObject]', () => {
		const mappedUser = (expectedData: Record<string, any>) => ({
			type: 'user',
			services: {
				password: {
					bcrypt: 'hashed=tempPassword',
				},
			},
			...expectedData,
		});

		const converter = new UserConverter({ workInMemory: true });
		const hashPassword = sinon.stub(converter, 'hashPassword');

		generateTempPassword.returns('tempPassword');
		hashPassword.callsFake(async (pass) => `hashed=${pass}`);
		bcryptHash.callsFake((pass: string) => `hashed=${pass}`);
		sha.callsFake((pass: string) => pass);

		it('should map an empty object', async () => {
			expect(
				await converter.buildNewUserObject({
					emails: [],
					importIds: [],
				} as unknown as IImportUser),
			).to.be.deep.equal(mappedUser({}));
		});

		it('should map the name and username', async () => {
			expect(
				await converter.buildNewUserObject({
					emails: [],
					importIds: [],
					name: 'name1',
					username: 'username1',
				} as unknown as IImportUser),
			).to.be.deep.equal(
				mappedUser({
					username: 'username1',
					name: 'name1',
				}),
			);
		});

		it('should map optional fields', async () => {
			expect(
				await converter.buildNewUserObject({
					emails: [],
					importIds: [],
					statusText: 'statusText1',
					bio: 'bio1',
					avatarUrl: 'avatarUrl',
					utcOffset: 3,
				} as unknown as IImportUser),
			).to.be.deep.equal(
				mappedUser({
					statusText: 'statusText1',
					bio: 'bio1',
					_pendingAvatarUrl: 'avatarUrl',
					utcOffset: 3,
				}),
			);
		});

		it('should map custom fields', async () => {
			expect(
				await (converter as any).buildNewUserObject({
					emails: [],
					importIds: [],
					customFields: {
						age: 32,
						nickname: 'stitch',
					},
				}),
			).to.be.deep.equal(
				mappedUser({
					customFields: {
						age: 32,
						nickname: 'stitch',
					},
				}),
			);
		});

		it('should not map roles', async () => {
			expect(
				await converter.buildNewUserObject({
					emails: [],
					importIds: [],
					roles: ['role1'],
				} as unknown as IImportUser),
			).to.be.deep.equal(mappedUser({}));
		});

		it('should map identifiers', async () => {
			expect(
				await converter.buildNewUserObject({
					name: 'user1',
					emails: ['user1@domain.com'],
					importIds: ['importId1'],
					username: 'username1',
				} as unknown as IImportUser),
			).to.be.deep.equal(
				mappedUser({
					username: 'username1',
					name: 'user1',
					importIds: ['importId1'],
					emails: [{ address: 'user1@domain.com', verified: false }],
				}),
			);
		});

		it('should map password', async () => {
			expect(
				await converter.buildNewUserObject({
					emails: [],
					importIds: [],
					password: 'batata',
				} as unknown as IImportUser),
			).to.be.deep.equal(
				mappedUser({
					services: {
						password: {
							bcrypt: 'hashed=batata',
						},
					},
				}),
			);
		});

		it('should map ldap service data', async () => {
			expect(
				await converter.buildNewUserObject({
					emails: [],
					importIds: [],
					services: {
						ldap: {
							id: 'id',
						},
					},
				} as unknown as IImportUser),
			).to.be.deep.equal(
				mappedUser({
					services: {
						ldap: {
							id: 'id',
						},
					},
					ldap: true,
				}),
			);
		});

		it('should map deleted users', async () => {
			expect(
				await converter.buildNewUserObject({
					emails: [],
					importIds: [],
					deleted: true,
				} as unknown as IImportUser),
			).to.be.deep.equal(
				mappedUser({
					active: false,
				}),
			);
		});

		it('should map restored users', async () => {
			expect(
				await converter.buildNewUserObject({
					emails: [],
					importIds: [],
					deleted: false,
				} as unknown as IImportUser),
			).to.be.deep.equal(
				mappedUser({
					active: true,
				}),
			);
		});

		it('should map user type', async () => {
			expect(
				await converter.buildNewUserObject({
					emails: [],
					importIds: [],
					type: 'user',
				}),
			).to.be.deep.equal(mappedUser({}));
		});

		it('should map bot type', async () => {
			expect(
				await converter.buildNewUserObject({
					emails: [],
					importIds: [],
					type: 'bot',
				}),
			).to.be.deep.equal(
				mappedUser({
					type: 'bot',
					services: {
						password: {
							bcrypt: 'hashed=tempPassword',
						},
					},
				}),
			);
		});
	});

	describe('[insertUser]', () => {
		it('function should be called by the converter', async () => {
			const converter = new UserConverter({ workInMemory: true, skipDefaultChannels: true });

			modelsMock.Users.findOneByEmailAddress.resolves(null);
			modelsMock.Users.findOneByUsernameIgnoringCase.resolves(null);

			const insertUser = sinon.stub(converter, 'insertUser');
			const updateUser = sinon.stub(converter, 'updateUser');

			await converter.addObject(userToImport);
			await converter.convertData();

			expect(updateUser.getCalls()).to.be.an('array').with.lengthOf(0);
			expect(insertUser.getCalls()).to.be.an('array').with.lengthOf(1);
			expect(insertUser.getCall(0).args).to.be.an('array').that.is.not.empty;
			expect(insertUser.getCall(0).args[0]).to.be.deep.equal(userToImport);
			expect(addUserToDefaultChannels.getCalls()).to.be.an('array').with.lengthOf(0);
		});

		it('function should not be called when skipNewUsers = true', async () => {
			const converter = new UserConverter({ workInMemory: true, skipNewUsers: true });

			sinon.stub(converter, 'findExistingUser');
			const insertUser = sinon.stub(converter, 'insertUser');
			sinon.stub(converter, 'updateUser');
			const skipMemoryRecord = sinon.stub(converter as unknown as { skipMemoryRecord: (id: string) => void }, 'skipMemoryRecord');

			await converter.addObject(userToImport);
			await converter.convertData();

			expect(insertUser.getCall(0)).to.be.null;
			expect(skipMemoryRecord.getCall(0)).to.not.be.null;
			expect(callbacks.run.getCall(0)).to.not.be.null;
			expect(callbacks.run.getCall(0).args).to.be.deep.equal(['afterUserImport', { inserted: [], updated: [], skipped: 1, failed: 0 }]);
		});

		it('function should not be called for existing users', async () => {
			const converter = new UserConverter({ workInMemory: true });

			const findExistingUser = sinon.stub(converter, 'findExistingUser');
			findExistingUser.resolves({ _id: 'oldId' } as unknown as IUser);
			const insertUser = sinon.stub(converter, 'insertUser');
			sinon.stub(converter, 'updateUser');

			await converter.addObject(userToImport);
			await converter.convertData();

			expect(insertUser.getCall(0)).to.be.null;
			expect(callbacks.run.getCall(0)).to.not.be.null;
			expect(callbacks.run.getCall(0).args).to.be.deep.equal([
				'afterUserImport',
				{ inserted: [], updated: ['oldId'], skipped: 0, failed: 0 },
			]);
		});

		it('addUserToDefaultChannels should be called by the converter on successful insert', async () => {
			const converter = new UserConverter({ workInMemory: true, skipDefaultChannels: false });

			modelsMock.Users.findOneByEmailAddress.resolves(null);
			modelsMock.Users.findOneByUsernameIgnoringCase.resolves(null);
			modelsMock.Users.findOneById.withArgs('newId').returns({ newUser: true });

			const insertUser = sinon.stub(converter, 'insertUser');

			insertUser.callsFake((() => 'newId') as unknown as InstanceType<typeof UserConverter>['insertUser']);

			await converter.addObject(userToImport);
			await converter.convertData();

			expect(insertUser.getCalls()).to.be.an('array').with.lengthOf(1);
			expect(insertUser.getCall(0).args).to.be.an('array').that.is.not.empty;
			expect(insertUser.getCall(0).args[0]).to.be.deep.equal(userToImport);
			expect(addUserToDefaultChannels.getCalls()).to.be.an('array').with.lengthOf(1);
			expect(addUserToDefaultChannels.getCall(0).args).to.be.an('array').that.deep.contains({ newUser: true });
		});

		it('should call insertUserDoc with the mapped data and roles', async () => {
			const converter = new UserConverter({ workInMemory: true });
			let insertedUser = null;

			insertUserDoc.callsFake((_options: any, data: any) => {
				insertedUser = {
					...data,
					_id: 'Id1',
				};
				return 'Id1';
			});

			modelsMock.Users.findOneById.withArgs('Id1').resolves(insertedUser);

			await (converter as any).insertUser({ ...userToImport, roles: ['role1', 'role2'] });

			expect(insertUserDoc.getCalls()).to.be.an('array').with.lengthOf(1);
			expect(insertUserDoc.getCall(0).args).to.be.an('array').with.lengthOf(2);

			const usedParams = insertUserDoc.getCall(0).args[1];
			expect(usedParams).to.deep.include({
				type: 'user',
				username: 'username1',
				name: 'user1',
				importIds: ['importId1'],
				emails: [{ address: 'user1@domain.com', verified: false }],
				globalRoles: ['role1', 'role2'],
			});
		});
	});

	describe('[updateUser]', () => {
		it('function should be called by the converter', async () => {
			const converter = new UserConverter({ workInMemory: true });

			const findExistingUser = sinon.stub(converter, 'findExistingUser');
			findExistingUser.resolves({ _id: 'oldId' } as unknown as IUser);
			const insertUser = sinon.stub(converter, 'insertUser');
			const updateUser = sinon.stub(converter, 'updateUser');

			await converter.addObject(userToImport);
			await converter.convertData();

			expect(insertUser.getCalls()).to.be.an('array').with.lengthOf(0);
			expect(updateUser.getCalls()).to.be.an('array').with.lengthOf(1);
			expect(updateUser.getCall(0).args).to.be.an('array').that.is.not.empty;
			expect(updateUser.getCall(0).args[1]).to.be.deep.equal(userToImport);
		});

		it('function should not be called when skipExistingUsers = true', async () => {
			const converter = new UserConverter({ workInMemory: true, skipExistingUsers: true });

			const findExistingUser = sinon.stub(converter, 'findExistingUser');
			findExistingUser.resolves({ _id: 'oldId' } as unknown as IUser);
			sinon.stub(converter, 'insertUser');
			const updateUser = sinon.stub(converter, 'updateUser');
			const skipMemoryRecord = sinon.stub(converter as unknown as { skipMemoryRecord: (id: string) => void }, 'skipMemoryRecord');

			await converter.addObject(userToImport);
			await converter.convertData();

			expect(updateUser.getCall(0)).to.be.null;
			expect(skipMemoryRecord.getCall(0)).to.not.be.null;
			expect(callbacks.run.getCall(0)).to.not.be.null;
			expect(callbacks.run.getCall(0).args).to.be.deep.equal(['afterUserImport', { inserted: [], updated: [], skipped: 1, failed: 0 }]);
		});

		it('function should not be called for new users', async () => {
			const converter = new UserConverter({ workInMemory: true });

			sinon.stub(converter, 'findExistingUser');
			sinon.stub(converter, 'insertUser');
			const updateUser = sinon.stub(converter, 'updateUser');

			await converter.addObject(userToImport);
			await converter.convertData();

			expect(updateUser.getCall(0)).to.be.null;
		});
	});

	// #TODO: Validate batch conversions

	describe('callbacks', () => {
		it('beforeImportFn should be triggered', async () => {
			const beforeImportFn = sinon.stub();

			beforeImportFn.callsFake(() => true);

			const converter = new UserConverter({ workInMemory: true, skipDefaultChannels: true });

			sinon.stub(converter, 'findExistingUser');
			const insertUser = sinon.stub(converter, 'insertUser');
			sinon.stub(converter, 'updateUser');

			await converter.addObject(userToImport);
			await converter.convertData({
				beforeImportFn,
			});

			expect(beforeImportFn.getCalls()).to.be.an('array').with.lengthOf(1);
			expect(insertUser.getCalls()).to.be.an('array').with.lengthOf(1);
		});

		it('afterImportFn should be triggered', async () => {
			const afterImportFn = sinon.stub();
			const converter = new UserConverter({ workInMemory: true, skipDefaultChannels: true });

			sinon.stub(converter, 'findExistingUser');
			const insertUser = sinon.stub(converter, 'insertUser');
			sinon.stub(converter, 'updateUser');

			await converter.addObject(userToImport);
			await converter.convertData({
				afterImportFn,
			});

			expect(insertUser.getCalls()).to.be.an('array').with.lengthOf(1);
			expect(afterImportFn.getCalls()).to.be.an('array').with.lengthOf(1);
		});

		it('should skip record if beforeImportFn returns false', async () => {
			let recordId = null;
			const beforeImportFn = sinon.stub();
			const afterImportFn = sinon.stub();

			beforeImportFn.callsFake((record) => {
				recordId = record._id;
				return false;
			});

			const converter = new UserConverter({ workInMemory: true, skipDefaultChannels: true });

			sinon.stub(converter, 'findExistingUser');
			sinon.stub(converter, 'insertUser');
			sinon.stub(converter, 'updateUser');
			const skipMemoryRecord = sinon.stub(converter as unknown as { skipMemoryRecord: (id: string) => void }, 'skipMemoryRecord');

			await converter.addObject(userToImport);
			await converter.convertData({
				beforeImportFn,
				afterImportFn,
			});

			expect(beforeImportFn.getCalls()).to.be.an('array').with.lengthOf(1);
			expect(skipMemoryRecord.getCalls()).to.be.an('array').with.lengthOf(1);
			expect(afterImportFn.getCalls()).to.be.an('array').with.lengthOf(0);
			expect(skipMemoryRecord.getCall(0).args).to.be.an('array').that.is.deep.equal([recordId]);

			expect(callbacks.run.getCall(0)).to.not.be.null;
			expect(callbacks.run.getCall(0).args).to.be.deep.equal(['afterUserImport', { inserted: [], updated: [], skipped: 1, failed: 0 }]);
		});

		it('should not skip record if beforeImportFn returns true', async () => {
			let userId = null;
			const beforeImportFn = sinon.stub();
			const afterImportFn = sinon.stub();

			beforeImportFn.callsFake(() => true);

			afterImportFn.callsFake((record) => {
				userId = record.data._id;
			});

			const converter = new UserConverter({ workInMemory: true, skipDefaultChannels: true });

			sinon.stub(converter, 'findExistingUser');
			const insertUser = sinon.stub(converter, 'insertUser');
			sinon.stub(converter, 'updateUser');

			await converter.addObject(userToImport);
			await converter.convertData({
				beforeImportFn,
				afterImportFn,
			});

			expect(beforeImportFn.getCalls()).to.be.an('array').with.lengthOf(1);
			expect(insertUser.getCalls()).to.be.an('array').with.lengthOf(1);
			expect(afterImportFn.getCalls()).to.be.an('array').with.lengthOf(1);

			expect(callbacks.run.getCall(0)).to.not.be.null;
			expect(callbacks.run.getCall(0).args).to.be.deep.equal([
				'afterUserImport',
				{ inserted: [userId], updated: [], skipped: 0, failed: 0 },
			]);
		});

		it('onErrorFn should be triggered if there is no email and no username', async () => {
			const converter = new UserConverter({ workInMemory: true, skipDefaultChannels: true });

			const onErrorFn = sinon.stub();

			sinon.stub(converter, 'findExistingUser');
			const insertUser = sinon.stub(converter, 'insertUser');
			sinon.stub(converter, 'updateUser');
			const saveError = sinon.stub(converter as unknown as { saveError: (importId: string, error: Error) => Promise<void> }, 'saveError');

			await converter.addObject({
				name: 'user1',
				emails: [],
				importIds: [],
			} as unknown as IImportUser);
			await converter.convertData({ onErrorFn });

			expect(insertUser.getCall(0)).to.be.null;
			expect(callbacks.run.getCall(0)).to.not.be.null;
			expect(callbacks.run.getCall(0).args).to.be.deep.equal(['afterUserImport', { inserted: [], updated: [], skipped: 0, failed: 1 }]);
			expect(onErrorFn.getCall(0)).to.not.be.null;
			expect(saveError.getCall(0)).to.not.be.null;
		});

		// #TODO: Validate afterBatchFn
	});
});

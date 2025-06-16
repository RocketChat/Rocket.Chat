import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const settingsStub = sinon.stub();
const modelsMock = {
	Users: {
		findOneByEmailAddress: sinon.stub(),
		findOneByUsernameIgnoringCase: sinon.stub(),
		findOneById: sinon.stub(),
	},
};
const addUserToDefaultChannels = sinon.stub();
const generateUsernameSuggestion = sinon.stub();
const insertUserDoc = sinon.stub();
const callbacks = {
	run: sinon.stub(),
};
const bcryptHash = sinon.stub();
const sha = sinon.stub();
const generateTempPassword = sinon.stub();

const { UserConverter } = proxyquire.noCallThru().load('../../../../../app/importer/server/classes/converters/UserConverter', {
	'../../../../../lib/callbacks': {
		callbacks,
	},
	'../../../settings/server': {
		settings: { get: settingsStub },
	},
	'../../../../lib/server/functions/addUserToDefaultChannels': {
		addUserToDefaultChannels,
	},
	'../../../../lib/server/functions/getUsernameSuggestion': {
		generateUsernameSuggestion,
	},
	'../../../../lib/server/functions/saveUserIdentity': {
		saveUserIdentity: sinon.stub(),
	},
	'../../../../lib/server/functions/setUserActiveStatus': {
		setUserActiveStatus: sinon.stub(),
	},
	'../../../../lib/server/lib/notifyListener': {
		notifyOnUserChange: sinon.stub(),
	},
	'./generateTempPassword': {
		generateTempPassword,
		'@global': true,
	},
	'bcrypt': {
		'hash': bcryptHash,
		'@global': true,
	},
	'meteor/check': sinon.stub(),
	'meteor/meteor': sinon.stub(),
	'@rocket.chat/sha256': {
		SHA256: sha,
	},
	'meteor/accounts-base': {
		Accounts: {
			insertUserDoc,
			_bcryptRounds: () => 10,
		},
	},
	'@rocket.chat/models': { ...modelsMock, '@global': true },
});

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
	};

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
				}),
			).to.be.deep.equal(mappedUser({}));
		});

		it('should map the name and username', async () => {
			expect(
				await converter.buildNewUserObject({
					emails: [],
					importIds: [],
					name: 'name1',
					username: 'username1',
				}),
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
				}),
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
				}),
			).to.be.deep.equal(mappedUser({}));
		});

		it('should map identifiers', async () => {
			expect(
				await converter.buildNewUserObject({
					name: 'user1',
					emails: ['user1@domain.com'],
					importIds: ['importId1'],
					username: 'username1',
				}),
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
				}),
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
				}),
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
				}),
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
				}),
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

			sinon.stub(converter, 'insertUser');
			sinon.stub(converter, 'updateUser');

			await converter.addObject(userToImport);
			await converter.convertData();

			expect(converter.updateUser.getCalls()).to.be.an('array').with.lengthOf(0);
			expect(converter.insertUser.getCalls()).to.be.an('array').with.lengthOf(1);
			expect(converter.insertUser.getCall(0).args).to.be.an('array').that.is.not.empty;
			expect(converter.insertUser.getCall(0).args[0]).to.be.deep.equal(userToImport);
			expect(addUserToDefaultChannels.getCalls()).to.be.an('array').with.lengthOf(0);
		});

		it('function should not be called when skipNewUsers = true', async () => {
			const converter = new UserConverter({ workInMemory: true, skipNewUsers: true });

			sinon.stub(converter, 'findExistingUser');
			sinon.stub(converter, 'insertUser');
			sinon.stub(converter, 'updateUser');
			sinon.stub(converter, 'skipMemoryRecord');

			await converter.addObject(userToImport);
			await converter.convertData();

			expect(converter.insertUser.getCall(0)).to.be.null;
			expect(converter.skipMemoryRecord.getCall(0)).to.not.be.null;
			expect(callbacks.run.getCall(0)).to.not.be.null;
			expect(callbacks.run.getCall(0).args).to.be.deep.equal(['afterUserImport', { inserted: [], updated: [], skipped: 1, failed: 0 }]);
		});

		it('function should not be called for existing users', async () => {
			const converter = new UserConverter({ workInMemory: true });

			sinon.stub(converter, 'findExistingUser');
			converter.findExistingUser.returns({ _id: 'oldId' });
			sinon.stub(converter, 'insertUser');
			sinon.stub(converter, 'updateUser');

			await converter.addObject(userToImport);
			await converter.convertData();

			expect(converter.insertUser.getCall(0)).to.be.null;
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

			sinon.stub(converter, 'insertUser');

			converter.insertUser.callsFake(() => 'newId');

			await converter.addObject(userToImport);
			await converter.convertData();

			expect(converter.insertUser.getCalls()).to.be.an('array').with.lengthOf(1);
			expect(converter.insertUser.getCall(0).args).to.be.an('array').that.is.not.empty;
			expect(converter.insertUser.getCall(0).args[0]).to.be.deep.equal(userToImport);
			expect(addUserToDefaultChannels.getCalls()).to.be.an('array').with.lengthOf(1);
			expect(addUserToDefaultChannels.getCall(0).args).to.be.an('array').that.deep.contains({ newUser: true });
		});

		it('should call insertUserDoc with the mapped data and roles', async () => {
			const converter = new UserConverter({ workInMemory: true });
			let insertedUser = null;

			insertUserDoc.callsFake((_options, data) => {
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

			sinon.stub(converter, 'findExistingUser');
			converter.findExistingUser.returns({ _id: 'oldId' });
			sinon.stub(converter, 'insertUser');
			sinon.stub(converter, 'updateUser');

			await converter.addObject(userToImport);
			await converter.convertData();

			expect(converter.insertUser.getCalls()).to.be.an('array').with.lengthOf(0);
			expect(converter.updateUser.getCalls()).to.be.an('array').with.lengthOf(1);
			expect(converter.updateUser.getCall(0).args).to.be.an('array').that.is.not.empty;
			expect(converter.updateUser.getCall(0).args[1]).to.be.deep.equal(userToImport);
		});

		it('function should not be called when skipExistingUsers = true', async () => {
			const converter = new UserConverter({ workInMemory: true, skipExistingUsers: true });

			sinon.stub(converter, 'findExistingUser');
			converter.findExistingUser.returns({ _id: 'oldId' });
			sinon.stub(converter, 'insertUser');
			sinon.stub(converter, 'updateUser');
			sinon.stub(converter, 'skipMemoryRecord');

			await converter.addObject(userToImport);
			await converter.convertData();

			expect(converter.updateUser.getCall(0)).to.be.null;
			expect(converter.skipMemoryRecord.getCall(0)).to.not.be.null;
			expect(callbacks.run.getCall(0)).to.not.be.null;
			expect(callbacks.run.getCall(0).args).to.be.deep.equal(['afterUserImport', { inserted: [], updated: [], skipped: 1, failed: 0 }]);
		});

		it('function should not be called for new users', async () => {
			const converter = new UserConverter({ workInMemory: true });

			sinon.stub(converter, 'findExistingUser');
			sinon.stub(converter, 'insertUser');
			sinon.stub(converter, 'updateUser');

			await converter.addObject(userToImport);
			await converter.convertData();

			expect(converter.updateUser.getCall(0)).to.be.null;
		});
	});

	// #TODO: Validate batch conversions

	describe('callbacks', () => {
		it('beforeImportFn should be triggered', async () => {
			const beforeImportFn = sinon.stub();

			beforeImportFn.callsFake(() => true);

			const converter = new UserConverter({ workInMemory: true, skipDefaultChannels: true });

			sinon.stub(converter, 'findExistingUser');
			sinon.stub(converter, 'insertUser');
			sinon.stub(converter, 'updateUser');

			await converter.addObject(userToImport);
			await converter.convertData({
				beforeImportFn,
			});

			expect(beforeImportFn.getCalls()).to.be.an('array').with.lengthOf(1);
			expect(converter.insertUser.getCalls()).to.be.an('array').with.lengthOf(1);
		});

		it('afterImportFn should be triggered', async () => {
			const afterImportFn = sinon.stub();
			const converter = new UserConverter({ workInMemory: true, skipDefaultChannels: true });

			sinon.stub(converter, 'findExistingUser');
			sinon.stub(converter, 'insertUser');
			sinon.stub(converter, 'updateUser');

			await converter.addObject(userToImport);
			await converter.convertData({
				afterImportFn,
			});

			expect(converter.insertUser.getCalls()).to.be.an('array').with.lengthOf(1);
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
			sinon.stub(converter, 'skipMemoryRecord');

			await converter.addObject(userToImport);
			await converter.convertData({
				beforeImportFn,
				afterImportFn,
			});

			expect(beforeImportFn.getCalls()).to.be.an('array').with.lengthOf(1);
			expect(converter.skipMemoryRecord.getCalls()).to.be.an('array').with.lengthOf(1);
			expect(afterImportFn.getCalls()).to.be.an('array').with.lengthOf(0);
			expect(converter.skipMemoryRecord.getCall(0).args).to.be.an('array').that.is.deep.equal([recordId]);

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
			sinon.stub(converter, 'insertUser');
			sinon.stub(converter, 'updateUser');

			await converter.addObject(userToImport);
			await converter.convertData({
				beforeImportFn,
				afterImportFn,
			});

			expect(beforeImportFn.getCalls()).to.be.an('array').with.lengthOf(1);
			expect(converter.insertUser.getCalls()).to.be.an('array').with.lengthOf(1);
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
			sinon.stub(converter, 'insertUser');
			sinon.stub(converter, 'updateUser');
			sinon.stub(converter, 'saveError');

			await converter.addObject({
				name: 'user1',
				emails: [],
				importIds: [],
			});
			await converter.convertData({ onErrorFn });

			expect(converter.insertUser.getCall(0)).to.be.null;
			expect(callbacks.run.getCall(0)).to.not.be.null;
			expect(callbacks.run.getCall(0).args).to.be.deep.equal(['afterUserImport', { inserted: [], updated: [], skipped: 0, failed: 1 }]);
			expect(onErrorFn.getCall(0)).to.not.be.null;
			expect(converter.saveError.getCall(0)).to.not.be.null;
		});

		// #TODO: Validate afterBatchFn
	});
});

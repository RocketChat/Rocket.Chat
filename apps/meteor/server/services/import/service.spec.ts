import type { IImport, IImportUser } from '@rocket.chat/core-typings';
import { ObjectId } from 'mongodb';

const mockImportsInvalidateAllOperations = jest.fn();
const mockImportsInsertOne = jest.fn();
const mockImportsFindOneById = jest.fn();
const mockImportsFindLastImport = jest.fn();
const mockImportsIncreaseTotalCount = jest.fn();
const mockImportsSetOperationStatus = jest.fn();
const mockImportDataDeleteMany = jest.fn();
const mockImportDataInsertMany = jest.fn();

jest.mock('@rocket.chat/core-services', () => ({
	ServiceClassInternal: class {
		protected name = '';
	},
}));

jest.mock('@rocket.chat/models', () => ({
	Imports: {
		invalidateAllOperations: (...args: unknown[]) => mockImportsInvalidateAllOperations(...args),
		insertOne: (...args: unknown[]) => mockImportsInsertOne(...args),
		findOneById: (...args: unknown[]) => mockImportsFindOneById(...args),
		findLastImport: (...args: unknown[]) => mockImportsFindLastImport(...args),
		increaseTotalCount: (...args: unknown[]) => mockImportsIncreaseTotalCount(...args),
		setOperationStatus: (...args: unknown[]) => mockImportsSetOperationStatus(...args),
	},
	ImportData: {
		col: {
			deleteMany: (...args: unknown[]) => mockImportDataDeleteMany(...args),
			insertMany: (...args: unknown[]) => mockImportDataInsertMany(...args),
		},
	},
}));

const mockImportersGet = jest.fn();
jest.mock('../../../app/importer/server', () => ({
	Importers: {
		get: (...args: unknown[]) => mockImportersGet(...args),
	},
}));

const mockSettingsGet = jest.fn();
jest.mock('../../../app/settings/server', () => ({
	settings: {
		get: (...args: unknown[]) => mockSettingsGet(...args),
	},
}));

const mockValidateRoleList = jest.fn();
jest.mock('../../lib/roles/validateRoleList', () => ({
	validateRoleList: (...args: unknown[]) => mockValidateRoleList(...args),
}));

const mockGetNewUserRoles = jest.fn();
jest.mock('../user/lib/getNewUserRoles', () => ({
	getNewUserRoles: (...args: unknown[]) => mockGetNewUserRoles(...args),
}));

// eslint-disable-next-line import/first
import { ImportService } from './service';

const createMockOperation = (overrides?: Partial<IImport>): IImport => ({
	_id: new ObjectId().toHexString(),
	type: 'csv',
	importerKey: 'csv',
	ts: new Date(),
	status: 'importer_new',
	valid: true,
	user: 'user123',
	_updatedAt: new Date(),
	...overrides,
});

describe('ImportService', () => {
	let service: ImportService;

	beforeEach(() => {
		jest.clearAllMocks();
		service = new ImportService();
		mockGetNewUserRoles.mockReturnValue(['user']);
		mockValidateRoleList.mockResolvedValue(true);
	});

	describe('clear', () => {
		it('should invalidate all operations and delete import data', async () => {
			await service.clear();

			expect(mockImportsInvalidateAllOperations).toHaveBeenCalledTimes(1);
			expect(mockImportDataDeleteMany).toHaveBeenCalledWith({});
		});
	});

	describe('newOperation', () => {
		it('should clear previous operations and create a new import', async () => {
			const mockOperation = createMockOperation();

			mockImportsInsertOne.mockResolvedValue({ insertedId: mockOperation._id });
			mockImportsFindOneById.mockResolvedValue(mockOperation);

			const result = await service.newOperation('user123', 'csv', 'csv');

			expect(mockImportsInvalidateAllOperations).toHaveBeenCalled();
			expect(mockImportDataDeleteMany).toHaveBeenCalledWith({});
			expect(mockImportsInsertOne).toHaveBeenCalledWith({
				type: 'csv',
				importerKey: 'csv',
				ts: expect.any(Date),
				status: 'importer_new',
				valid: true,
				user: 'user123',
			});
			expect(result).toEqual(mockOperation);
		});

		it('should throw an error if operation creation fails', async () => {
			mockImportsInsertOne.mockResolvedValue({ insertedId: new ObjectId().toHexString() });
			mockImportsFindOneById.mockResolvedValue(null);

			await expect(service.newOperation('user123', 'csv', 'csv')).rejects.toThrow('failed to create import operation');
		});
	});

	describe('status', () => {
		it('should return state "none" when no operation exists', async () => {
			mockImportsFindLastImport.mockResolvedValue(null);

			const result = await service.status();

			expect(result).toEqual({ state: 'none' });
		});

		it('should return "new" state for importer_new status', async () => {
			const mockOperation = createMockOperation();
			mockImportsFindLastImport.mockResolvedValue(mockOperation);

			const result = await service.status();

			expect(result).toEqual({ state: 'new', operation: mockOperation });
		});

		it('should return "loading" state for uploading status', async () => {
			const mockOperation = createMockOperation({ status: 'importer_uploading' });
			mockImportsFindLastImport.mockResolvedValue(mockOperation);

			const result = await service.status();

			expect(result).toEqual({ state: 'loading', operation: mockOperation });
		});

		it('should return "ready" state for user_selection status', async () => {
			const mockOperation = createMockOperation({ status: 'importer_user_selection' });
			mockImportsFindLastImport.mockResolvedValue(mockOperation);

			const result = await service.status();

			expect(result).toEqual({ state: 'ready', operation: mockOperation });
		});

		it('should return "importing" state for importing statuses', async () => {
			const mockOperation = createMockOperation({ status: 'importer_importing_users' });
			mockImportsFindLastImport.mockResolvedValue(mockOperation);

			const result = await service.status();

			expect(result).toEqual({ state: 'importing', operation: mockOperation });
		});

		it('should return "done" state for importer_done status', async () => {
			const mockOperation = createMockOperation({ status: 'importer_done' });
			mockImportsFindLastImport.mockResolvedValue(mockOperation);

			const result = await service.status();

			expect(result).toEqual({ state: 'done', operation: mockOperation });
		});

		it('should return "error" state for invalid operation', async () => {
			const mockOperation = createMockOperation({ valid: false });
			mockImportsFindLastImport.mockResolvedValue(mockOperation);

			const result = await service.status();

			expect(result).toEqual({ state: 'error', operation: mockOperation });
		});

		it('should return "canceled" state for cancelled import', async () => {
			const mockOperation = createMockOperation({ status: 'importer_import_cancelled' });
			mockImportsFindLastImport.mockResolvedValue(mockOperation);

			const result = await service.status();

			expect(result).toEqual({ state: 'canceled', operation: mockOperation });
		});
	});

	describe('addUsers', () => {
		const mockOperation = createMockOperation({
			_id: 'op1',
		});

		beforeEach(() => {
			mockImportsFindLastImport.mockResolvedValue(mockOperation);
		});

		it('should return early for empty users array', async () => {
			await service.addUsers([]);

			expect(mockImportsFindLastImport).not.toHaveBeenCalled();
			expect(mockImportDataInsertMany).not.toHaveBeenCalled();
		});

		it('should throw error if operation is not valid', async () => {
			mockImportsFindLastImport.mockResolvedValue({ ...mockOperation, valid: false });

			const users: Omit<IImportUser, '_id' | 'services' | 'customFields'>[] = [
				{ emails: ['test@example.com'], importIds: ['id1'], type: 'user' },
			];

			await expect(service.addUsers(users)).rejects.toThrow('Import operation not initialized.');
		});

		it('should throw error if user has no emails', async () => {
			const users: Omit<IImportUser, '_id' | 'services' | 'customFields'>[] = [{ emails: [], importIds: ['id1'], type: 'user' }];

			await expect(service.addUsers(users)).rejects.toThrow('Users are missing required data.');
		});

		it('should throw error if user has no importIds', async () => {
			const users: Omit<IImportUser, '_id' | 'services' | 'customFields'>[] = [
				{ emails: ['test@example.com'], importIds: [], type: 'user' },
			];

			await expect(service.addUsers(users)).rejects.toThrow('Users are missing required data.');
		});

		it('should throw error if roles are invalid', async () => {
			mockValidateRoleList.mockResolvedValue(false);

			const users: Omit<IImportUser, '_id' | 'services' | 'customFields'>[] = [
				{ emails: ['test@example.com'], importIds: ['id1'], type: 'user', roles: ['invalid-role'] },
			];

			await expect(service.addUsers(users)).rejects.toThrow('One or more of the users have been assigned invalid roles.');
		});

		it('should add users with default roles when no roles provided', async () => {
			mockGetNewUserRoles.mockReturnValue(['user']);

			const users: Omit<IImportUser, '_id' | 'services' | 'customFields'>[] = [
				{ emails: ['test@example.com'], importIds: ['id1'], type: 'user' },
			];

			await service.addUsers(users);

			expect(mockImportDataInsertMany).toHaveBeenCalledWith([
				expect.objectContaining({
					data: expect.objectContaining({
						roles: ['user'],
					}),
					dataType: 'user',
				}),
			]);
		});

		// Test for the condition fixed in the previous commit:
		// The fix was changing `[...new Set(...data.roles, ...defaultRoles)]` to `[...new Set([...data.roles, ...defaultRoles])]`
		// This ensures user roles are properly merged with default roles without duplicates
		it('should correctly merge user roles with default roles without duplicates', async () => {
			mockGetNewUserRoles.mockReturnValue(['user', 'guest']);

			const users: Omit<IImportUser, '_id' | 'services' | 'customFields'>[] = [
				{ emails: ['test@example.com'], importIds: ['id1'], type: 'user', roles: ['admin', 'user'] }, // 'user' is in both
			];

			await service.addUsers(users);

			const insertCall = mockImportDataInsertMany.mock.calls[0][0];
			const insertedRoles = insertCall[0].data.roles;

			// Verify roles are merged correctly: admin, user, guest (user appears once due to Set deduplication)
			expect(insertedRoles).toContain('admin');
			expect(insertedRoles).toContain('user');
			expect(insertedRoles).toContain('guest');
			// Ensure no duplicates - the length should be exactly 3
			expect(insertedRoles.length).toBe(3);
			expect(new Set(insertedRoles).size).toBe(3);
		});

		it('should correctly merge multiple user roles with multiple default roles', async () => {
			mockGetNewUserRoles.mockReturnValue(['user', 'default-role']);

			const users: Omit<IImportUser, '_id' | 'services' | 'customFields'>[] = [
				{
					emails: ['test1@example.com'],
					importIds: ['id1'],
					type: 'user',
					roles: ['admin', 'moderator'],
				},
				{
					emails: ['test2@example.com'],
					importIds: ['id2'],
					type: 'user',
					roles: ['user'], // Already in default roles
				},
			];

			await service.addUsers(users);

			const insertCall = mockImportDataInsertMany.mock.calls[0][0];

			// First user: admin, moderator + user, default-role = 4 unique roles
			const firstUserRoles = insertCall[0].data.roles;
			expect(firstUserRoles).toContain('admin');
			expect(firstUserRoles).toContain('moderator');
			expect(firstUserRoles).toContain('user');
			expect(firstUserRoles).toContain('default-role');
			expect(new Set(firstUserRoles).size).toBe(4);

			// Second user: user + user, default-role = should dedupe to 2 unique roles
			const secondUserRoles = insertCall[1].data.roles;
			expect(secondUserRoles).toContain('user');
			expect(secondUserRoles).toContain('default-role');
			expect(new Set(secondUserRoles).size).toBe(2);
		});

		it('should update operation status and count after adding users', async () => {
			const users: Omit<IImportUser, '_id' | 'services' | 'customFields'>[] = [
				{ emails: ['test@example.com'], importIds: ['id1'], type: 'user' },
			];

			await service.addUsers(users);

			expect(mockImportsIncreaseTotalCount).toHaveBeenCalledWith('op1', 'users', 1);
			expect(mockImportsSetOperationStatus).toHaveBeenCalledWith('op1', 'importer_user_selection');
		});

		it('should throw error when operation is in loading state', async () => {
			mockImportsFindLastImport.mockResolvedValue({ ...mockOperation, status: 'importer_uploading' });

			const users: Omit<IImportUser, '_id' | 'services' | 'customFields'>[] = [
				{ emails: ['test@example.com'], importIds: ['id1'], type: 'user' },
			];

			await expect(service.addUsers(users)).rejects.toThrow('The current import operation can not receive new data.');
		});

		it('should throw error when operation is in importing state', async () => {
			mockImportsFindLastImport.mockResolvedValue({ ...mockOperation, status: 'importer_importing_users' });

			const users: Omit<IImportUser, '_id' | 'services' | 'customFields'>[] = [
				{ emails: ['test@example.com'], importIds: ['id1'], type: 'user' },
			];

			await expect(service.addUsers(users)).rejects.toThrow('The current import operation can not receive new data.');
		});

		it('should throw error when operation is done', async () => {
			mockImportsFindLastImport.mockResolvedValue({ ...mockOperation, status: 'importer_done' });

			const users: Omit<IImportUser, '_id' | 'services' | 'customFields'>[] = [
				{ emails: ['test@example.com'], importIds: ['id1'], type: 'user' },
			];

			await expect(service.addUsers(users)).rejects.toThrow('The current import operation is already finished.');
		});
	});

	describe('run', () => {
		const mockOperation = createMockOperation({ status: 'importer_user_selection' });

		it('should throw error if operation not found', async () => {
			mockImportsFindLastImport.mockResolvedValue(null);

			await expect(service.run('user123')).rejects.toThrow('error-operation-not-found');
		});

		it('should throw error if operation is invalid', async () => {
			mockImportsFindLastImport.mockResolvedValue({ ...mockOperation, valid: false });

			await expect(service.run('user123')).rejects.toThrow('error-operation-not-found');
		});

		it('should throw error if operation status is not user_selection', async () => {
			mockImportsFindLastImport.mockResolvedValue({ ...mockOperation, status: 'importer_new' });

			await expect(service.run('user123')).rejects.toThrow('error-invalid-operation-status');
		});

		it('should throw error if importer not found', async () => {
			mockImportsFindLastImport.mockResolvedValue(mockOperation);
			mockImportersGet.mockReturnValue(null);

			await expect(service.run('user123')).rejects.toThrow('error-importer-not-defined');
		});

		it('should start import with correct options', async () => {
			mockImportsFindLastImport.mockResolvedValue(mockOperation);
			mockSettingsGet.mockReturnValue(true);

			const mockStartImport = jest.fn();
			const MockImporter = jest.fn().mockImplementation(() => ({
				startImport: mockStartImport,
			}));

			mockImportersGet.mockReturnValue({
				importer: MockImporter,
			});

			await service.run('user123');

			expect(mockImportersGet).toHaveBeenCalledWith('csv');
			expect(MockImporter).toHaveBeenCalledWith({ importer: MockImporter }, mockOperation, {
				skipUserCallbacks: true,
				skipDefaultChannels: true,
				enableEmail2fa: true,
				quickUserInsertion: true,
				skipExistingUsers: true,
			});
			expect(mockStartImport).toHaveBeenCalledWith({ users: { all: true } }, 'user123');
		});
	});
});

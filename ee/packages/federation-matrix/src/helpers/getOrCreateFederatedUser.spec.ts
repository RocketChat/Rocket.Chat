import { federationSDK } from '@rocket.chat/federation-sdk';
import { Users } from '@rocket.chat/models';

import { createOrUpdateFederatedUser } from './createOrUpdateFederatedUser';
import { getOrCreateFederatedUser } from './getOrCreateFederatedUser';

jest.mock('@rocket.chat/models', () => ({
	Users: {
		findOneByUsername: jest.fn(),
	},
}));

jest.mock('@rocket.chat/federation-sdk', () => ({
	federationSDK: {
		getConfig: jest.fn(),
		getAppServiceForUser: jest.fn(),
	},
}));

jest.mock('@rocket.chat/logger', () => ({
	Logger: jest.fn().mockImplementation(() => ({
		error: jest.fn(),
		warn: jest.fn(),
		info: jest.fn(),
		debug: jest.fn(),
	})),
}));

jest.mock('./createOrUpdateFederatedUser', () => ({
	createOrUpdateFederatedUser: jest.fn(),
}));

const mockFindOneByUsername = Users.findOneByUsername as jest.MockedFunction<typeof Users.findOneByUsername>;
const mockGetConfig = federationSDK.getConfig as jest.MockedFunction<typeof federationSDK.getConfig>;
const mockGetAppServiceForUser = federationSDK.getAppServiceForUser as jest.MockedFunction<typeof federationSDK.getAppServiceForUser>;
const mockCreateOrUpdateFederatedUser = createOrUpdateFederatedUser as jest.MockedFunction<typeof createOrUpdateFederatedUser>;

// what createOrUpdateFederatedUser resolves to on first contact: a complete user document
const createdUser = {
	_id: 'user123',
	username: '@alice:example.com',
	name: '@alice:example.com',
	createdAt: new Date(),
	_updatedAt: new Date(),
	type: 'user',
	active: true,
	roles: ['federated-external'],
	federated: true,
	federation: { version: 1, mui: '@alice:example.com', origin: 'example.com' },
};

describe('getOrCreateFederatedUser', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockGetConfig.mockReturnValue('local.com' as any);
		mockGetAppServiceForUser.mockReturnValue(undefined);
	});

	describe('when the user already exists locally (warm path)', () => {
		it('should return the existing user without creating anything', async () => {
			mockFindOneByUsername.mockResolvedValueOnce(createdUser as any);

			const result = await getOrCreateFederatedUser('@alice:example.com');

			expect(result).toBe(createdUser);
			expect(mockCreateOrUpdateFederatedUser).not.toHaveBeenCalled();
		});

		it('should look the remote user up by the full Matrix ID', async () => {
			mockFindOneByUsername.mockResolvedValueOnce(createdUser as any);

			await getOrCreateFederatedUser('@alice:example.com');

			expect(mockFindOneByUsername).toHaveBeenCalledWith('@alice:example.com');
		});

		it('should look a local user up by the localpart only', async () => {
			mockFindOneByUsername.mockResolvedValueOnce({ ...createdUser, username: 'bob', name: 'Bob' } as any);

			await getOrCreateFederatedUser('@bob:local.com');

			expect(mockFindOneByUsername).toHaveBeenCalledWith('bob');
		});

		// local users are allowed to exist without a display name, so requiring one here would
		// drop every membership event they take part in
		it('should return a local user that has no name', async () => {
			const namelessUser = { _id: 'user123', username: 'bob' };
			mockFindOneByUsername.mockResolvedValueOnce(namelessUser as any);

			await expect(getOrCreateFederatedUser('@bob:local.com')).resolves.toBe(namelessUser);
		});

		it('should throw when the existing user has no username', async () => {
			mockFindOneByUsername.mockResolvedValueOnce({ _id: 'user123', name: 'Alice' } as any);

			await expect(getOrCreateFederatedUser('@alice:example.com')).rejects.toThrow(
				'Error getting or creating federated user @alice:example.com',
			);
		});
	});

	describe('when the remote user is unknown locally (cold path)', () => {
		// the document itself is built by createOrUpdateFederatedUser, so its completeness is covered
		// in createOrUpdateFederatedUser.spec.ts; all this path can show is that nothing is stripped
		// off or rebuilt on the way out
		it('should return the created document untouched', async () => {
			mockFindOneByUsername.mockResolvedValueOnce(null);
			mockCreateOrUpdateFederatedUser.mockResolvedValueOnce(createdUser as any);

			const result = await getOrCreateFederatedUser('@alice:example.com');

			expect(result).toBe(createdUser);
		});

		it('should create the user with the full Matrix ID and the origin server', async () => {
			mockFindOneByUsername.mockResolvedValueOnce(null);
			mockCreateOrUpdateFederatedUser.mockResolvedValueOnce(createdUser as any);

			await getOrCreateFederatedUser('@alice:example.com');

			expect(mockCreateOrUpdateFederatedUser).toHaveBeenCalledWith({
				username: '@alice:example.com',
				name: '@alice:example.com',
				origin: 'example.com',
			});
		});

		it('should not create anything for a malformed Matrix ID', async () => {
			mockFindOneByUsername.mockResolvedValueOnce(null);

			await expect(getOrCreateFederatedUser('@not a valid mxid:example.com')).rejects.toThrow(
				'Error getting or creating federated user @not a valid mxid:example.com',
			);
			expect(mockCreateOrUpdateFederatedUser).not.toHaveBeenCalled();
		});

		it('should preserve the underlying failure as the error cause', async () => {
			const cause = new Error('mongo is down');
			mockFindOneByUsername.mockResolvedValueOnce(null);
			mockCreateOrUpdateFederatedUser.mockRejectedValueOnce(cause);

			await expect(getOrCreateFederatedUser('@alice:example.com')).rejects.toThrow(expect.objectContaining({ cause }) as unknown as Error);
		});
	});

	describe('when the user is local', () => {
		it('should throw instead of creating a federated user for an unknown local user', async () => {
			mockFindOneByUsername.mockResolvedValueOnce(null);

			await expect(getOrCreateFederatedUser('@bob:local.com')).rejects.toThrow('Error getting or creating federated user @bob:local.com');
			expect(mockCreateOrUpdateFederatedUser).not.toHaveBeenCalled();
		});
	});

	describe('when the user belongs to an application service', () => {
		it('should return the appservice user looked up by full Matrix ID', async () => {
			const appServiceUser = { ...createdUser, username: '@irc_bob:local.com', name: 'irc_bob' };
			mockFindOneByUsername.mockResolvedValueOnce(null).mockResolvedValueOnce(appServiceUser as any);
			mockGetAppServiceForUser.mockReturnValue({ registration: { _id: 'as1' } } as any);

			const result = await getOrCreateFederatedUser('@irc_bob:local.com');

			expect(result).toBe(appServiceUser);
			expect(mockFindOneByUsername).toHaveBeenLastCalledWith('@irc_bob:local.com');
			expect(mockCreateOrUpdateFederatedUser).not.toHaveBeenCalled();
		});

		it('should throw when the appservice user does not exist', async () => {
			mockFindOneByUsername.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
			mockGetAppServiceForUser.mockReturnValue({ registration: { _id: 'as1' } } as any);

			await expect(getOrCreateFederatedUser('@irc_bob:local.com')).rejects.toThrow(
				'Error getting or creating federated user @irc_bob:local.com',
			);
			expect(mockCreateOrUpdateFederatedUser).not.toHaveBeenCalled();
		});
	});
});

import { UserStatus } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import { createOrUpdateFederatedUser } from './createOrUpdateFederatedUser';

jest.mock('@rocket.chat/models', () => ({
	Users: {
		findOneAndUpdate: jest.fn(),
	},
}));

const mockFindOneAndUpdate = Users.findOneAndUpdate as jest.MockedFunction<typeof Users.findOneAndUpdate>;

const fakeUser = {
	_id: 'user123',
	username: '@alice:example.com',
	name: '@alice:example.com',
	federated: true,
	federation: { version: 1, mui: '@alice:example.com', origin: 'example.com' },
};

describe('createOrUpdateFederatedUser', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should assign the "federated" role to the new user', async () => {
		mockFindOneAndUpdate.mockResolvedValueOnce(fakeUser as any);

		await createOrUpdateFederatedUser({ username: '@alice:example.com', origin: 'example.com' });

		expect(mockFindOneAndUpdate).toHaveBeenCalledTimes(1);
		const [, updateDoc] = mockFindOneAndUpdate.mock.calls[0];
		expect((updateDoc as any).$set.roles).toEqual(['federated-external']);
	});

	it('should not assign the "user" role to federated users', async () => {
		mockFindOneAndUpdate.mockResolvedValueOnce(fakeUser as any);

		await createOrUpdateFederatedUser({ username: '@alice:example.com', origin: 'example.com' });

		const [, updateDoc] = mockFindOneAndUpdate.mock.calls[0];
		expect((updateDoc as any).$set.roles).not.toContain('user');
	});

	it('should set federated=true on the created/updated user', async () => {
		mockFindOneAndUpdate.mockResolvedValueOnce(fakeUser as any);

		await createOrUpdateFederatedUser({ username: '@alice:example.com', origin: 'example.com' });

		const [, updateDoc] = mockFindOneAndUpdate.mock.calls[0];
		expect((updateDoc as any).$set.federated).toBe(true);
	});

	it('should use the provided name when supplied', async () => {
		mockFindOneAndUpdate.mockResolvedValueOnce(fakeUser as any);

		await createOrUpdateFederatedUser({ username: '@alice:example.com', name: 'Alice', origin: 'example.com' });

		const [, updateDoc] = mockFindOneAndUpdate.mock.calls[0];
		expect((updateDoc as any).$set.name).toBe('Alice');
	});

	it('should default name to username when name is not provided', async () => {
		mockFindOneAndUpdate.mockResolvedValueOnce(fakeUser as any);

		await createOrUpdateFederatedUser({ username: '@alice:example.com', origin: 'example.com' });

		const [, updateDoc] = mockFindOneAndUpdate.mock.calls[0];
		expect((updateDoc as any).$set.name).toBe('@alice:example.com');
	});

	it('should set initial status to OFFLINE', async () => {
		mockFindOneAndUpdate.mockResolvedValueOnce(fakeUser as any);

		await createOrUpdateFederatedUser({ username: '@alice:example.com', origin: 'example.com' });

		const [, updateDoc] = mockFindOneAndUpdate.mock.calls[0];
		expect((updateDoc as any).$set.status).toBe(UserStatus.OFFLINE);
	});

	it('should store the origin server in the federation object', async () => {
		mockFindOneAndUpdate.mockResolvedValueOnce(fakeUser as any);

		await createOrUpdateFederatedUser({ username: '@alice:example.com', origin: 'example.com' });

		const [, updateDoc] = mockFindOneAndUpdate.mock.calls[0];
		expect((updateDoc as any).$set.federation.origin).toBe('example.com');
	});

	it('should use upsert so the user is created if not found', async () => {
		mockFindOneAndUpdate.mockResolvedValueOnce(fakeUser as any);

		await createOrUpdateFederatedUser({ username: '@alice:example.com', origin: 'example.com' });

		const [, , options] = mockFindOneAndUpdate.mock.calls[0];
		expect((options as any).upsert).toBe(true);
	});

	it('should throw when findOneAndUpdate returns null', async () => {
		mockFindOneAndUpdate.mockResolvedValueOnce(null as any);

		await expect(createOrUpdateFederatedUser({ username: '@alice:example.com', origin: 'example.com' })).rejects.toThrow(
			'Failed to create or update federated user: @alice:example.com',
		);
	});

	it('should throw when the returned document is not a native federated user', async () => {
		mockFindOneAndUpdate.mockResolvedValueOnce({ _id: 'user123', username: '@alice:example.com', name: 'Alice' } as any);

		await expect(createOrUpdateFederatedUser({ username: '@alice:example.com', origin: 'example.com' })).rejects.toThrow(
			'Failed to create or update federated user: @alice:example.com',
		);
	});

	// callers subscribe the returned document to a room, so a projection here silently hands them a
	// user missing every field but the two projected ones
	it('should not project fields away, so the full user document is returned', async () => {
		mockFindOneAndUpdate.mockResolvedValueOnce(fakeUser as any);

		await createOrUpdateFederatedUser({ username: '@alice:example.com', origin: 'example.com' });

		const [, , options] = mockFindOneAndUpdate.mock.calls[0];
		expect(options).not.toHaveProperty('projection');
	});

	// the pre-image of an upsert that inserted is null, which would fail every first contact
	it('should ask for the document as it looks after the upsert', async () => {
		mockFindOneAndUpdate.mockResolvedValueOnce(fakeUser as any);

		await createOrUpdateFederatedUser({ username: '@alice:example.com', origin: 'example.com' });

		const [, , options] = mockFindOneAndUpdate.mock.calls[0];
		expect((options as any).returnDocument).toBe('after');
	});

	it('should return the user returned by findOneAndUpdate', async () => {
		mockFindOneAndUpdate.mockResolvedValueOnce(fakeUser as any);

		const result = await createOrUpdateFederatedUser({ username: '@alice:example.com', origin: 'example.com' });

		expect(result).toBe(fakeUser);
	});
});

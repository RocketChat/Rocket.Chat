import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import { Accounts } from 'meteor/accounts-base';
import type { Profile } from 'passport';

import { verifyFunction } from './verifyFunction';

jest.mock(
	'meteor/accounts-base',
	() => ({
		Accounts: {
			updateOrCreateUserFromExternalService: jest.fn(),
		},
	}),
	{ virtual: true },
);

jest.mock('@rocket.chat/models', () => ({
	Users: {
		findOneById: jest.fn(),
	},
}));

describe('OAuth verifyFunction', () => {
	const done = jest.fn();
	const mockUser: IUser = {
		_id: 'user-id-123',
		createdAt: new Date(),
		_updatedAt: new Date(),
		username: 'testuser',
		name: 'Test User',
		type: 'user',
		active: true,
		roles: ['user'],
	};

	beforeEach(() => {
		jest.clearAllMocks();
		jest.mocked(Accounts.updateOrCreateUserFromExternalService).mockResolvedValue({ userId: 'user-id-123' });
		jest.mocked(Users.findOneById).mockResolvedValue(mockUser);
	});

	it('should resolve flat email and name strings from Custom OAuth profile shape', async () => {
		const customOAuthProfile = {
			id: 'custom-id-123',
			email: 'custom@example.com',
			name: 'Custom User',
		} as unknown as Profile;

		await verifyFunction('access-token', 'refresh-token', customOAuthProfile, done, 'custom_oauth');

		expect(Accounts.updateOrCreateUserFromExternalService).toHaveBeenCalledWith(
			'custom_oauth',
			expect.objectContaining({
				accessToken: 'access-token',
				refreshToken: 'refresh-token',
				id: 'custom-id-123',
				email: 'custom@example.com',
				name: 'Custom User',
			}),
			{},
		);
		expect(done).toHaveBeenCalledWith(null, mockUser);
	});

	it('should give precedence to standard Passport profile emails array and displayName', async () => {
		const standardPassportProfile = {
			id: 'passport-id-456',
			displayName: 'Passport Display Name',
			name: 'Profile Name',
			email: 'flat@example.com',
			emails: [{ value: 'passport@example.com' }],
		} as unknown as Profile;

		await verifyFunction('access-token', 'refresh-token', standardPassportProfile, done, 'google');

		expect(Accounts.updateOrCreateUserFromExternalService).toHaveBeenCalledWith(
			'google',
			expect.objectContaining({
				accessToken: 'access-token',
				refreshToken: 'refresh-token',
				id: 'passport-id-456',
				email: 'passport@example.com',
				name: 'Passport Display Name',
			}),
			{},
		);
		expect(done).toHaveBeenCalledWith(null, mockUser);
	});

	it('should fall back to _json.email when top-level email and emails array are absent', async () => {
		const jsonFallbackProfile = {
			id: 'json-id-789',
			displayName: 'JSON User',
			_json: {
				email: 'json@example.com',
			},
		} as unknown as Profile;

		await verifyFunction('access-token', 'refresh-token', jsonFallbackProfile, done, 'custom_oauth');

		expect(Accounts.updateOrCreateUserFromExternalService).toHaveBeenCalledWith(
			'custom_oauth',
			expect.objectContaining({
				id: 'json-id-789',
				email: 'json@example.com',
				name: 'JSON User',
			}),
			{},
		);
		expect(done).toHaveBeenCalledWith(null, mockUser);
	});

	it('should protect resolved name from being overwritten by conflicting structured name in profile or _json', async () => {
		const conflictingNameProfile = {
			id: 'conflict-id-101',
			displayName: 'Resolved Display Name',
			name: {
				familyName: 'Doe',
				givenName: 'John',
			},
			_json: {
				name: 'Conflicting JSON Name',
			},
			emails: [{ value: 'john.doe@example.com' }],
		} as unknown as Profile;

		await verifyFunction('access-token', 'refresh-token', conflictingNameProfile, done, 'custom_oauth');

		expect(Accounts.updateOrCreateUserFromExternalService).toHaveBeenCalledWith(
			'custom_oauth',
			expect.objectContaining({
				id: 'conflict-id-101',
				name: 'Resolved Display Name',
				email: 'john.doe@example.com',
			}),
			{},
		);
		expect(done).toHaveBeenCalledWith(null, mockUser);
	});

	it('should catch errors from updateOrCreateUserFromExternalService and call done(error) without unhandled rejection', async () => {
		const error = new Error('Username already exists. [403]');
		jest.mocked(Accounts.updateOrCreateUserFromExternalService).mockRejectedValue(error);

		const profile = {
			id: 'error-id-102',
			email: 'error@example.com',
			name: 'Error User',
		} as unknown as Profile;

		await verifyFunction('access-token', 'refresh-token', profile, done, 'custom_oauth');

		expect(done).toHaveBeenCalledWith(error);
		expect(done).not.toHaveBeenCalledWith(null, expect.anything());
	});

	it('should call done with "User not found" error when user is not found in database', async () => {
		jest.mocked(Users.findOneById).mockResolvedValue(null);

		const profile = {
			id: 'not-found-id-103',
			email: 'notfound@example.com',
			name: 'Not Found User',
		} as unknown as Profile;

		await verifyFunction('access-token', 'refresh-token', profile, done, 'custom_oauth');

		expect(done).toHaveBeenCalledWith(expect.any(Error));
		expect(done).toHaveBeenCalledWith(expect.objectContaining({ message: 'User not found' }));
	});
});

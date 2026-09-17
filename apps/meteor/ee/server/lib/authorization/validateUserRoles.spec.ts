import { MeteorError } from '@rocket.chat/core-services';
import { License, MockedLicenseBuilder } from '@rocket.chat/license';

import { validateUserRoles } from './validateUserRoles';

beforeEach(async () => {
	const license = new MockedLicenseBuilder();
	await License.setWorkspaceUrl('http://localhost:3000');
	License.setLicenseLimitCounter('activeUsers', () => 0);
	License.setLicenseLimitCounter('guestUsers', () => 0);
	License.setLicenseLimitCounter('roomsPerGuest', async () => 0);
	License.setLicenseLimitCounter('privateApps', () => 0);
	License.setLicenseLimitCounter('marketplaceApps', () => 0);
	License.setLicenseLimitCounter('monthlyActiveContacts', async () => 0);

	License.setLicenseLimitCounter('activeUsers', () => 1);

	license
		.withLimits('activeUsers', [
			{
				max: 1,
				behavior: 'prevent_action',
			},
		])
		.withLimits('guestUsers', [
			{
				max: 1,
				behavior: 'prevent_action',
			},
		]);

	await License.setLicense(await license.sign());
});

describe('Operating after activeUsers Limits', () => {
	beforeEach(async () => {
		License.setLicenseLimitCounter('activeUsers', () => 1);
	});

	describe('Adding a new user', () => {
		it('should  throw error when user is active as undefined', async () => {
			const user = {
				roles: ['user'],
			};

			await expect(validateUserRoles(user)).rejects.toThrow(MeteorError);
		});

		it('should not throw error when user is not active', async () => {
			const user = {
				active: false,
				type: 'user',
			};

			await expect(validateUserRoles(user)).resolves.not.toThrow();
		});

		it('should not throw error when user is an app', async () => {
			const user = {
				active: true,
				type: 'app',
			};

			await expect(validateUserRoles(user)).resolves.not.toThrow();
		});

		it('should not throw error when user is a bot', async () => {
			const user = {
				active: true,
				type: 'bot',
			};

			await expect(validateUserRoles(user)).resolves.not.toThrow();
		});

		it('should not throw error when user is a guest', async () => {
			const user = {
				active: true,
				type: 'user',
				roles: ['guest'],
			};

			await expect(validateUserRoles(user)).resolves.not.toThrow();
		});

		it('should throw error when user is active', async () => {
			const user = {
				active: true,
				type: 'user',
			};
			await expect(validateUserRoles(user)).rejects.toThrow(MeteorError);
		});
	});

	describe('Editing an existing user', () => {
		beforeEach(async () => {
			License.setLicenseLimitCounter('guestUsers', () => 1);
		});
		afterEach(async () => {
			License.setLicenseLimitCounter('guestUsers', () => 0);
		});

		it('should throw an error when we try to activate a user', async () => {
			const user = {
				active: true,
				type: 'user',
			};
			const currentUser = {
				active: false,
				type: 'user',
			};
			await expect(validateUserRoles(user, currentUser)).rejects.toThrow(MeteorError);
		});

		it('should not throw an error when we try to deactivate a user', async () => {
			const user = {
				active: false,
				type: 'user',
			};
			const currentUser = {
				active: true,
				type: 'user',
			};
			await expect(validateUserRoles(user, currentUser)).resolves.not.toThrow();
		});

		it('should not throw an error when we try to change an active user', async () => {
			const user = {
				active: true,
				type: 'user',
			};
			const currentUser = {
				active: true,
				type: 'user',
			};
			await expect(validateUserRoles(user, currentUser)).resolves.not.toThrow();
		});

		it('should throw an error when we try to convert a bot to a user', async () => {
			const user = {
				active: true,
				type: 'user',
			};
			const currentUser = {
				active: true,
				type: 'bot',
			};
			await expect(validateUserRoles(user, currentUser)).rejects.toThrow(MeteorError);
		});
	});
});

describe('Operating after guestUsers Limits', () => {
	beforeEach(async () => {
		License.setLicenseLimitCounter('guestUsers', () => 1);
	});

	it('should throw an error when we try to convert an user to guest', async () => {
		const user = {
			active: true,
			type: 'user',
			roles: ['guest'],
		};
		const currentUser = {
			active: true,
			type: 'user',
		};
		await expect(validateUserRoles(user, currentUser)).rejects.toThrow(MeteorError);
	});

	it('should  throw an error when we try to convert app to guest', async () => {
		const user = {
			active: true,
			type: 'user',
			roles: ['guest'],
		};
		const currentUser = {
			active: true,
			type: 'app',
		};
		await expect(validateUserRoles(user, currentUser)).rejects.toThrow(MeteorError);
	});

	it('should not throw an error when we try to edit a guest', async () => {
		const user = {
			active: true,
			type: 'user',
			roles: ['guest'],
		};
		const currentUser = {
			active: true,
			type: 'user',
			roles: ['guest'],
		};
		await expect(validateUserRoles(user, currentUser)).resolves.not.toThrow();
	});
});

describe('Operating under activeUsers Limits', () => {
	beforeEach(async () => {
		License.setLicenseLimitCounter('activeUsers', () => 0);
	});

	describe('Adding a new user', () => {
		it('should not throw an error validating a regular user', async () => {
			const user = {
				active: true,
				type: 'user',
			};
			await expect(validateUserRoles(user)).resolves.not.toThrow();
		});
	});

	describe('Editing an existing user', () => {
		it('should not throw an error when we try to activate a user', async () => {
			const user = {
				active: true,
				type: 'user',
			};
			const currentUser = {
				active: false,
				type: 'user',
			};
			await expect(validateUserRoles(user, currentUser)).resolves.not.toThrow();
		});

		it('should not throw an error when we try to convert a guest to a user', async () => {
			const user = {
				active: true,
				type: 'user',
			};
			const currentUser = {
				active: true,
				type: 'user',
				roles: ['guest'],
			};
			await expect(validateUserRoles(user, currentUser)).resolves.not.toThrow();
		});
		it('should not throw an error when we try to convert a bot to a user', async () => {
			const user = {
				active: true,
				type: 'user',
			};
			const currentUser = {
				active: true,
				type: 'bot',
			};
			await expect(validateUserRoles(user, currentUser)).resolves.not.toThrow();
		});
		it('should not throw an error when we try to convert an app to a user', async () => {
			const user = {
				active: true,
				type: 'user',
			};
			const currentUser = {
				active: true,
				type: 'app',
			};
			await expect(validateUserRoles(user, currentUser)).resolves.not.toThrow();
		});
	});
});

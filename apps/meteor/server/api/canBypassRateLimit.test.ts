import { before, describe, it, mock } from 'node:test';

import { expect } from 'chai';

const userPermissions: Record<string, string[]> = {
	bot: ['api-bypass-rate-limit', 'send-many-messages'],
	legacyBot: ['send-many-messages'],
	regular: [],
};

let canBypassRateLimit: any;

before(async () => {
	const moduleMocks = [
		mock.module('../lib/authorization/hasPermission', {
			exports: {
				hasAtLeastOnePermissionAsync: async (userId: string, permissions: string[]): Promise<boolean> =>
					permissions.some((permission) => userPermissions[userId].includes(permission)),
			},
		}),
		mock.module('../lib/deprecationWarningLogger', {
			exports: {
				apiDeprecationLogger: { endpoint: () => undefined },
			},
		}),
	];
	({ canBypassRateLimit } = await import('./api.helpers'));
	moduleMocks.forEach((moduleMock) => moduleMock.restore());
});

describe('canBypassRateLimit', () => {
	it('should let a user holding api-bypass-rate-limit through on any route', async () => {
		expect(await canBypassRateLimit('bot')).to.be.true;
	});

	it('should not let a regular user through', async () => {
		expect(await canBypassRateLimit('regular')).to.be.false;
		expect(await canBypassRateLimit('regular', ['send-many-messages'])).to.be.false;
	});

	it('should let a user holding a route specific permission through', async () => {
		expect(await canBypassRateLimit('legacyBot', ['send-many-messages'])).to.be.true;
	});

	it('should not let a route specific permission apply to routes that do not declare it', async () => {
		expect(await canBypassRateLimit('legacyBot')).to.be.false;
	});
});

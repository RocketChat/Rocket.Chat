import { expect } from 'chai';
import { describe, it } from 'mocha';
import mock from 'proxyquire';

const userPermissions: Record<string, string[]> = {
	bot: ['api-bypass-rate-limit', 'send-many-messages'],
	legacyBot: ['send-many-messages'],
	regular: [],
};

const mocks = {
	'../lib/authorization/hasPermission': {
		hasAtLeastOnePermissionAsync: async (userId: string, permissions: string[]): Promise<boolean> =>
			permissions.some((permission) => userPermissions[userId].includes(permission)),
	},
	'../lib/deprecationWarningLogger': {
		apiDeprecationLogger: { endpoint: () => undefined },
	},
};

const { canBypassRateLimit } = mock.noCallThru().load('../../../../server/api/api.helpers', mocks);

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

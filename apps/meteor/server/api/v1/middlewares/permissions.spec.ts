import { LocalBroker, ServiceClass, api } from '@rocket.chat/core-services';
import type { IAuthorization } from '@rocket.chat/core-services';
import { Hono } from 'hono';

import { permissionsMiddleware } from './permissions';
import type { TypedOptions } from '../../definition';

jest.mock('../../api', () => ({
	API: {
		v1: {
			unauthorized: (msg: string) => ({ statusCode: 401, body: { success: false, error: msg } }),
			forbidden: (msg: string) => ({ statusCode: 403, body: { success: false, error: msg } }),
			internalError: () => ({ statusCode: 500, body: { success: false, error: 'Internal server error' } }),
		},
	},
}));

const hasAll = jest.fn();
const hasAny = jest.fn();
const handler = jest.fn();

class AuthorizationDouble extends ServiceClass implements Pick<IAuthorization, 'hasAllPermission' | 'hasAtLeastOnePermission'> {
	protected name = 'authorization';

	async hasAllPermission(...args: Parameters<IAuthorization['hasAllPermission']>) {
		return hasAll(...args);
	}

	async hasAtLeastOnePermission(...args: Parameters<IAuthorization['hasAtLeastOnePermission']>) {
		return hasAny(...args);
	}
}

const authorization = new AuthorizationDouble();

const userId = 'user-id';

const send = (permissionsRequired: unknown, { user = { _id: userId }, method = 'GET' }: { user?: unknown; method?: string } = {}) => {
	const app = new Hono();
	app.use(async (c, next) => {
		c.set('user' as never, user as never);
		await next();
	});
	app.use(permissionsMiddleware({ permissionsRequired } as TypedOptions));
	app.all('/', (c) => {
		handler();
		return c.text('handled');
	});

	return app.request('/', { method });
};

describe('permissionsMiddleware', () => {
	beforeAll(() => {
		api.setBroker(new LocalBroker());
		api.registerService(authorization);
	});

	afterAll(async () => {
		await api.destroyService(authorization);
	});

	beforeEach(() => {
		jest.clearAllMocks();
		hasAll.mockResolvedValue(false);
		hasAny.mockResolvedValue(false);
	});

	it('should let the request through when the route requires no permission', async () => {
		const response = await send(undefined, { user: null });

		expect(response.status).toBe(200);
		expect(hasAll).not.toHaveBeenCalled();
	});

	it('should answer 401 to an anonymous request on a protected route', async () => {
		const response = await send({ '*': { operation: 'hasAll', permissions: ['view-logs'] } }, { user: null });

		expect(response.status).toBe(401);
		expect(hasAll).not.toHaveBeenCalled();
		expect(handler).not.toHaveBeenCalled();
	});

	it('should run the route when the user has every permission', async () => {
		hasAll.mockResolvedValue(true);

		const response = await send({ '*': { operation: 'hasAll', permissions: ['view-logs', 'manage-apps'] } });

		expect(response.status).toBe(200);
		expect(hasAll).toHaveBeenCalledWith(userId, ['view-logs', 'manage-apps'], undefined);
		expect(handler).toHaveBeenCalledTimes(1);
	});

	it('should run the route when the user has one of the permissions', async () => {
		hasAny.mockResolvedValue(true);

		const response = await send({ '*': { operation: 'hasAny', permissions: ['view-logs', 'manage-apps'] } });

		expect(response.status).toBe(200);
		expect(hasAny).toHaveBeenCalledWith(userId, ['view-logs', 'manage-apps'], undefined);
		expect(hasAll).not.toHaveBeenCalled();
	});

	it('should answer 403 and not run the route when the user lacks the permission', async () => {
		const response = await send({ '*': { operation: 'hasAll', permissions: ['view-logs'] } });

		expect(response.status).toBe(403);
		expect(handler).not.toHaveBeenCalled();
	});

	it('should prefer the permissions of the request method over the ones for any method', async () => {
		hasAll.mockResolvedValue(true);

		await send(
			{
				'*': { operation: 'hasAll', permissions: ['read-thing'] },
				'POST': { operation: 'hasAll', permissions: ['write-thing'] },
			},
			{ method: 'POST' },
		);

		expect(hasAll).toHaveBeenCalledWith(userId, ['write-thing'], undefined);
	});

	it('should refuse a method the route lists no permissions for', async () => {
		hasAll.mockResolvedValue(true);

		const response = await send({ GET: { operation: 'hasAll', permissions: ['read-thing'] } }, { method: 'DELETE' });

		expect(response.status).toBe(403);
		expect(handler).not.toHaveBeenCalled();
	});

	it('should refuse a route with an unknown permission operation', async () => {
		hasAll.mockResolvedValue(true);
		hasAny.mockResolvedValue(true);

		const response = await send({ '*': { operation: 'hasNone', permissions: ['view-logs'] } });

		expect(response.status).toBe(403);
		expect(handler).not.toHaveBeenCalled();
	});

	it('should run the route when the method lists an empty set of permissions', async () => {
		const response = await send({ '*': { operation: 'hasAll', permissions: [] } });

		expect(response.status).toBe(200);
		expect(hasAll).not.toHaveBeenCalled();
	});

	it('should answer 500 and not run the route when permissions cannot be checked', async () => {
		hasAll.mockRejectedValue(new Error('database is down'));

		const response = await send({ '*': { operation: 'hasAll', permissions: ['view-logs'] } });

		expect(response.status).toBe(500);
		expect(await response.text()).not.toContain('database is down');
		expect(handler).not.toHaveBeenCalled();
	});
});

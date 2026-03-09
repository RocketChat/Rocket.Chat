import type { IUser } from '@rocket.chat/core-typings';
import type { Context } from 'hono';

import type { TypedOptions } from '../definition';

jest.mock('../ApiClass', () => ({
	applyBreakingChanges: false,
}));

jest.mock('../api', () => ({
	API: {
		v1: {
			unauthorized: jest.fn((msg?: string) => ({
				statusCode: 401,
				body: { success: false, error: msg || 'unauthorized' },
			})),
			forbidden: jest.fn((msg?: string) => ({
				statusCode: 403,
				body: { success: false, error: msg || 'unauthorized' },
			})),
			internalError: jest.fn(() => ({
				statusCode: 500,
				body: { success: false, error: 'Internal server error' },
			})),
		},
	},
}));

jest.mock('../api.helpers', () => ({
	checkPermissionsForInvocation: jest.fn(),
}));

jest.mock('@rocket.chat/logger', () => ({
	Logger: jest.fn().mockImplementation(() => ({
		error: jest.fn(),
	})),
}));

import { API } from '../api';
import { checkPermissionsForInvocation } from '../api.helpers';
import { permissionsMiddleware } from './permissions';

const applyBreakingChangesModule = require('../ApiClass');

const mockUser = { _id: 'user123' } as IUser;

const createMockContext = (user?: IUser | null, method = 'GET'): Context => {
	const jsonMock = jest.fn();
	return {
		get: jest.fn((key: string) => (key === 'user' ? user : undefined)),
		json: jsonMock,
		req: {
			method,
		},
	} as unknown as Context;
};

beforeEach(() => {
	jest.clearAllMocks();
	applyBreakingChangesModule.applyBreakingChanges = false;
});

describe('permissionsMiddleware', () => {
	describe('when permissionsRequired is not set', () => {
		it('should call next() and skip permission checks', async () => {
			const middleware = permissionsMiddleware({} as unknown as TypedOptions);
			const mockContext = createMockContext();
			const next = jest.fn();

			await middleware(mockContext, next);

			expect(next).toHaveBeenCalledTimes(1);
			expect(mockContext.json).not.toHaveBeenCalled();
		});
	});

	describe('when permissionsRequired is set', () => {
		const options = {
			permissionsRequired: {
				GET: { permissions: ['view-room-administration'], operation: 'hasAll' as const },
			},
		} as unknown as TypedOptions;

		describe('when user is not logged in', () => {
			it('should return 401 unauthorized when applyBreakingChanges is true', async () => {
				applyBreakingChangesModule.applyBreakingChanges = true;

				const middleware = permissionsMiddleware(options);
				const mockContext = createMockContext(null);
				const next = jest.fn();

				await middleware(mockContext, next);

				expect(next).not.toHaveBeenCalled();
				expect(API.v1.unauthorized).toHaveBeenCalledWith();
				expect(mockContext.json).toHaveBeenCalledWith({ success: false, error: 'unauthorized' }, 401);
			});

			it('should return 401 unauthorized with legacy message when applyBreakingChanges is false', async () => {
				applyBreakingChangesModule.applyBreakingChanges = false;

				const middleware = permissionsMiddleware(options);
				const mockContext = createMockContext(null);
				const next = jest.fn();

				await middleware(mockContext, next);

				expect(next).not.toHaveBeenCalled();
				expect(API.v1.unauthorized).toHaveBeenCalledWith(
					'User does not have the permissions required for this action [error-unauthorized]',
				);
				expect(mockContext.json).toHaveBeenCalledWith(
					{ success: false, error: 'User does not have the permissions required for this action [error-unauthorized]' },
					401,
				);
			});
		});

		describe('when user is logged in but does not have the required permission', () => {
			beforeEach(() => {
				(checkPermissionsForInvocation as jest.Mock).mockResolvedValue(false);
			});

			it('should return 403 forbidden when applyBreakingChanges is true', async () => {
				applyBreakingChangesModule.applyBreakingChanges = true;

				const middleware = permissionsMiddleware(options);
				const mockContext = createMockContext(mockUser);
				const next = jest.fn();

				await middleware(mockContext, next);

				expect(next).not.toHaveBeenCalled();
				expect(API.v1.forbidden).toHaveBeenCalledWith();
				expect(mockContext.json).toHaveBeenCalledWith({ success: false, error: 'unauthorized' }, 403);
			});

			it('should return 401 unauthorized with legacy message when applyBreakingChanges is false', async () => {
				applyBreakingChangesModule.applyBreakingChanges = false;

				const middleware = permissionsMiddleware(options);
				const mockContext = createMockContext(mockUser);
				const next = jest.fn();

				await middleware(mockContext, next);

				expect(next).not.toHaveBeenCalled();
				expect(API.v1.unauthorized).toHaveBeenCalledWith(
					'User does not have the permissions required for this action [error-unauthorized]',
				);
				expect(mockContext.json).toHaveBeenCalledWith(
					{ success: false, error: 'User does not have the permissions required for this action [error-unauthorized]' },
					401,
				);
			});
		});

		describe('when user is logged in and has the required permission', () => {
			beforeEach(() => {
				(checkPermissionsForInvocation as jest.Mock).mockResolvedValue(true);
			});

			it('should call next()', async () => {
				const middleware = permissionsMiddleware(options);
				const mockContext = createMockContext(mockUser);
				const next = jest.fn();

				await middleware(mockContext, next);

				expect(next).toHaveBeenCalledTimes(1);
				expect(mockContext.json).not.toHaveBeenCalled();
			});
		});

		describe('when checkPermissionsForInvocation throws an error', () => {
			it('should return 500 internal error', async () => {
				(checkPermissionsForInvocation as jest.Mock).mockRejectedValue(new Error('DB error'));

				const middleware = permissionsMiddleware(options);
				const mockContext = createMockContext(mockUser);
				const next = jest.fn();

				await middleware(mockContext, next);

				expect(next).not.toHaveBeenCalled();
				expect(API.v1.internalError).toHaveBeenCalledWith();
				expect(mockContext.json).toHaveBeenCalledWith({ success: false, error: 'Internal server error' }, 500);
			});
		});
	});
});

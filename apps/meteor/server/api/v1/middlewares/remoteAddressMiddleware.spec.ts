import type { Context } from 'hono';

import { remoteAddressMiddleware } from './remoteAddressMiddleware';

describe('remoteAddressMiddleware', () => {
	it('should set remoteAddress from x-real-ip header', async () => {
		const mockContext = {
			req: {
				header: (name: string) => (name === 'x-real-ip' ? '192.168.1.1' : undefined),
			},
			env: {
				server: {
					incoming: {
						socket: {
							remoteAddress: '10.0.0.1',
						},
					},
				},
			},
			set: jest.fn(),
		} as unknown as Context;

		const next = jest.fn();

		await remoteAddressMiddleware(mockContext, next);

		expect(mockContext.set).toHaveBeenCalledWith('remoteAddress', '192.168.1.1');
		expect(next).toHaveBeenCalled();
	});

	it('should set remoteAddress from socket.remoteAddress when no headers are present', async () => {
		const mockContext = {
			req: {
				header: () => undefined,
			},
			env: {
				server: {
					incoming: {
						socket: {
							remoteAddress: '10.0.0.1',
						},
					},
				},
			},
			set: jest.fn(),
		} as unknown as Context;

		const next = jest.fn();

		await remoteAddressMiddleware(mockContext, next);

		expect(mockContext.set).toHaveBeenCalledWith('remoteAddress', '10.0.0.1');
		expect(next).toHaveBeenCalled();
	});

	it('should handle x-forwarded-for header with HTTP_FORWARDED_COUNT', async () => {
		process.env.HTTP_FORWARDED_COUNT = '2';
		const mockContext = {
			req: {
				header: (name: string) => (name === 'x-forwarded-for' ? '192.168.1.1, 10.0.0.1, 172.16.0.1' : undefined),
			},
			env: {
				server: {
					incoming: {
						socket: {
							remoteAddress: '10.0.0.1',
						},
					},
				},
			},
			set: jest.fn(),
		} as unknown as Context;

		const next = jest.fn();

		await remoteAddressMiddleware(mockContext, next);

		expect(mockContext.set).toHaveBeenCalledWith('remoteAddress', '10.0.0.1');
		expect(next).toHaveBeenCalled();
	});

	it('should fallback to socket.remoteAddress when x-forwarded-for count is invalid', async () => {
		process.env.HTTP_FORWARDED_COUNT = '5';
		const mockContext = {
			req: {
				header: (name: string) => (name === 'x-forwarded-for' ? '192.168.1.1, 10.0.0.1' : undefined),
			},
			env: {
				server: {
					incoming: {
						socket: {
							remoteAddress: '10.0.0.1',
						},
					},
				},
			},
			set: jest.fn(),
		} as unknown as Context;

		const next = jest.fn();

		await remoteAddressMiddleware(mockContext, next);

		expect(mockContext.set).toHaveBeenCalledWith('remoteAddress', '10.0.0.1');
		expect(next).toHaveBeenCalled();
	});

	it('should handle missing socket information', async () => {
		const mockContext = {
			req: {
				header: (name: string) => (name === 'x-forwarded-for' ? '192.168.1.1' : undefined),
			},
			env: {
				server: {
					incoming: {
						socket: {},
						connection: {},
					},
				},
			},
			set: jest.fn(),
		} as unknown as Context;

		const next = jest.fn();

		await remoteAddressMiddleware(mockContext, next);

		expect(mockContext.set).toHaveBeenCalledWith('remoteAddress', '192.168.1.1');
		expect(next).toHaveBeenCalled();
	});
});

import type { SlashCommand } from '@rocket.chat/core-typings';
import { mockAppRoot, type StreamControllerRef } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';

import { useAppSlashCommands } from './useAppSlashCommands';
import { slashCommands } from '../../app/utils/client/slashCommand';

const mockSlashCommands: SlashCommand[] = [
	{
		command: '/test',
		description: 'Test command',
		params: 'param1 param2',
		clientOnly: false,
		providesPreview: false,
		appId: 'test-app-1',
		permission: undefined,
	},
	{
		command: '/weather',
		description: 'Get weather information',
		params: 'city',
		clientOnly: false,
		providesPreview: true,
		appId: 'weather-app',
		permission: undefined,
	},
];

const mockApiResponse = {
	commands: mockSlashCommands,
	total: mockSlashCommands.length,
};

describe('useAppSlashCommands', () => {
	let mockGetSlashCommands: jest.Mock;

	beforeEach(() => {
		mockGetSlashCommands = jest.fn().mockResolvedValue(mockApiResponse);

		slashCommands.commands = {};
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should not fetch data when user ID is not available', () => {
		renderHook(() => useAppSlashCommands(), {
			wrapper: mockAppRoot().withEndpoint('GET', '/v1/commands.list', mockGetSlashCommands).build(),
		});

		expect(mockGetSlashCommands).not.toHaveBeenCalled();
		expect(slashCommands.commands).toEqual({});
	});

	it('should fetch slash commands when user ID is available', async () => {
		renderHook(() => useAppSlashCommands(), {
			wrapper: mockAppRoot().withEndpoint('GET', '/v1/commands.list', mockGetSlashCommands).withJohnDoe().build(),
		});

		await waitFor(() => {
			expect(Object.keys(slashCommands.commands)).toHaveLength(mockSlashCommands.length);
		});
	});

	it('should handle command/removed event by invalidating queries', async () => {
		const streamRef: StreamControllerRef<'apps'> = {};

		renderHook(() => useAppSlashCommands(), {
			wrapper: mockAppRoot()
				.withJohnDoe()
				.withStream('apps', streamRef)
				.withEndpoint('GET', '/v1/commands.list', mockGetSlashCommands)
				.build(),
		});

		expect(streamRef.controller).toBeDefined();

		await waitFor(() => {
			expect(Object.keys(slashCommands.commands)).toHaveLength(mockSlashCommands.length);
		});

		streamRef.controller?.emit('apps', [['command/removed', ['/test']]]);

		expect(slashCommands.commands['/test']).toBeUndefined();
		expect(slashCommands.commands['/weather']).toBeDefined();
	});

	it('should handle command/added event by invalidating queries', async () => {
		const streamRef: StreamControllerRef<'apps'> = {};

		renderHook(() => useAppSlashCommands(), {
			wrapper: mockAppRoot()
				.withJohnDoe()
				.withStream('apps', streamRef)
				.withEndpoint('GET', '/v1/commands.list', mockGetSlashCommands)
				.build(),
		});

		expect(streamRef.controller).toBeDefined();

		await waitFor(() => {
			expect(Object.keys(slashCommands.commands)).toHaveLength(mockSlashCommands.length);
		});

		mockGetSlashCommands.mockResolvedValue({
			commands: [
				...mockSlashCommands,
				{
					command: '/newcommand',
					description: 'New command',
					params: 'param1 param2',
					clientOnly: false,
				},
			],
			total: mockSlashCommands.length + 1,
		});

		streamRef.controller?.emit('apps', [['command/added', ['/newcommand']]]);

		await waitFor(() => {
			expect(slashCommands.commands['/newcommand']).toBeDefined();
		});

		expect(slashCommands.commands['/test']).toBeDefined();
		expect(slashCommands.commands['/weather']).toBeDefined();
	});

	it('should handle command/updated event by invalidating queries', async () => {
		const streamRef: StreamControllerRef<'apps'> = {};

		renderHook(() => useAppSlashCommands(), {
			wrapper: mockAppRoot()
				.withJohnDoe()
				.withStream('apps', streamRef)
				.withEndpoint('GET', '/v1/commands.list', mockGetSlashCommands)
				.build(),
		});

		expect(streamRef.controller).toBeDefined();

		await waitFor(() => {
			expect(Object.keys(slashCommands.commands)).toHaveLength(mockSlashCommands.length);
		});

		streamRef.controller?.emit('apps', [['command/updated', ['/test']]]);

		expect(slashCommands.commands['/test']).toBeUndefined();
		expect(slashCommands.commands['/weather']).toBeDefined();
	});

	it('should ignore command/disabled event', async () => {
		const streamRef: StreamControllerRef<'apps'> = {};

		renderHook(() => useAppSlashCommands(), {
			wrapper: mockAppRoot()
				.withJohnDoe()
				.withStream('apps', streamRef)
				.withEndpoint('GET', '/v1/commands.list', mockGetSlashCommands)
				.build(),
		});

		expect(streamRef.controller).toBeDefined();

		await waitFor(() => {
			expect(Object.keys(slashCommands.commands)).toHaveLength(mockSlashCommands.length);
		});

		streamRef.controller?.emit('apps', [['command/disabled', ['/test']]]);

		expect(slashCommands.commands['/test']).toBeDefined();
		expect(slashCommands.commands['/weather']).toBeDefined();
	});

	it('should not set up stream listener when user ID is not available', () => {
		const streamRef: StreamControllerRef<'apps'> = {};

		renderHook(() => useAppSlashCommands(), {
			wrapper: mockAppRoot().withStream('apps', streamRef).build(),
		});

		expect(streamRef.controller).toBeDefined();
		expect(streamRef.controller?.has('apps')).toBe(false);
	});
});

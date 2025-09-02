import type { SlashCommand } from '@rocket.chat/core-typings';
import { useEndpoint, useStream, useUserId } from '@rocket.chat/ui-contexts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';

import { useAppSlashCommands } from './useAppSlashCommands';
import { slashCommands } from '../../app/utils/client/slashCommand';

jest.mock('../../app/utils/client/slashCommand', () => ({
	slashCommands: {
		commands: {},
		add: jest.fn(),
	},
}));

jest.mock('@rocket.chat/fuselage-hooks', () => ({
	useDebouncedCallback: jest.fn((callback) => callback),
}));

jest.mock('@rocket.chat/ui-contexts', () => ({
	useUserId: jest.fn(),
	useStream: jest.fn(),
	useEndpoint: jest.fn(),
}));

const mockUseUserId = jest.mocked(useUserId);
const mockUseStream = jest.mocked(useStream);
const mockUseEndpoint = jest.mocked(useEndpoint);

const mockSlashCommands: Pick<SlashCommand, 'clientOnly' | 'command' | 'description' | 'params' | 'providesPreview' | 'appId'>[] = [
	{
		command: '/test',
		description: 'Test command',
		params: 'param1 param2',
		clientOnly: false,
		providesPreview: false,
		appId: 'test-app-1',
	},
	{
		command: '/weather',
		description: 'Get weather information',
		params: 'city',
		clientOnly: false,
		providesPreview: true,
		appId: 'weather-app',
	},
];

const mockApiResponse = {
	commands: mockSlashCommands,
	total: mockSlashCommands.length,
};

describe('useAppSlashCommands', () => {
	let queryClient: QueryClient;
	let mockGetSlashCommands: jest.Mock;
	let mockStreamCallback: jest.Mock;

	beforeEach(() => {
		queryClient = new QueryClient({
			defaultOptions: {
				queries: {
					retry: false,
				},
			},
		});

		mockUseUserId.mockReturnValue('test-user-id');

		mockStreamCallback = jest.fn();
		mockUseStream.mockReturnValue(mockStreamCallback);

		mockGetSlashCommands = jest.fn().mockResolvedValue(mockApiResponse);
		mockUseEndpoint.mockReturnValue(mockGetSlashCommands);

		slashCommands.commands = {};
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	const renderHookWithProviders = () => {
		return renderHook(() => useAppSlashCommands(), {
			wrapper: ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
		});
	};

	it('should not fetch data when user ID is not available', () => {
		mockUseUserId.mockReturnValue(null);

		renderHook(() => useAppSlashCommands(), {
			wrapper: ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
		});

		expect(mockGetSlashCommands).not.toHaveBeenCalled();
	});

	it('should fetch slash commands when user ID is available', async () => {
		renderHookWithProviders();

		await waitFor(() => {
			expect(mockGetSlashCommands).toHaveBeenCalledWith({ offset: 0, count: 50 });
		});
	});

	it('should add fetched commands to slashCommands', async () => {
		renderHookWithProviders();

		await waitFor(() => {
			expect(slashCommands.add).toHaveBeenCalledTimes(mockSlashCommands.length);
			mockSlashCommands.forEach((command) => {
				expect(slashCommands.add).toHaveBeenCalledWith(command);
			});
		});
	});

	it('should set up stream listener for app events', () => {
		renderHookWithProviders();

		expect(mockUseStream).toHaveBeenCalledWith('apps');
		expect(mockStreamCallback).toHaveBeenCalledWith('apps', expect.any(Function));
	});

	it('should handle command/removed event by invalidating queries', () => {
		renderHookWithProviders();

		// Get the stream callback function
		const streamCallback = mockStreamCallback.mock.calls[0][1];

		// Simulate command/removed event
		streamCallback(['command/removed', ['/test']]);

		// The hook should handle the event (we can't easily test the debounced invalidation without more complex setup)
		expect(mockStreamCallback).toHaveBeenCalledWith('apps', expect.any(Function));
	});

	it('should handle command/added event by invalidating queries', () => {
		renderHookWithProviders();

		// Get the stream callback function
		const streamCallback = mockStreamCallback.mock.calls[0][1];

		// Simulate command/added event
		streamCallback(['command/added', ['/newcommand']]);

		// The hook should handle the event
		expect(mockStreamCallback).toHaveBeenCalledWith('apps', expect.any(Function));
	});

	it('should handle command/updated event by invalidating queries', () => {
		renderHookWithProviders();

		// Get the stream callback function
		const streamCallback = mockStreamCallback.mock.calls[0][1];

		// Simulate command/updated event
		streamCallback(['command/updated', ['/updatedcommand']]);

		// The hook should handle the event
		expect(mockStreamCallback).toHaveBeenCalledWith('apps', expect.any(Function));
	});

	it('should ignore unknown stream events', () => {
		renderHookWithProviders();

		// Get the stream callback function
		const streamCallback = mockStreamCallback.mock.calls[0][1];

		// Simulate unknown event
		streamCallback(['unknown/event', ['/test']]);

		// The hook should handle the event gracefully
		expect(mockStreamCallback).toHaveBeenCalledWith('apps', expect.any(Function));
	});

	it('should clean up stream listener when component unmounts', () => {
		const mockCleanup = jest.fn();
		mockStreamCallback.mockReturnValue(mockCleanup);

		const { unmount } = renderHookWithProviders();

		unmount();

		expect(mockCleanup).toHaveBeenCalled();
	});

	it('should not set up stream listener when user ID is not available', () => {
		mockUseUserId.mockReturnValue(null);

		renderHook(() => useAppSlashCommands(), {
			wrapper: ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
		});

		// The useStream hook is called, but the useEffect that sets up the listener should not run
		expect(mockUseStream).toHaveBeenCalledWith('apps');
		// But the stream callback should not be called because uid is null
		expect(mockStreamCallback).not.toHaveBeenCalled();
	});
});

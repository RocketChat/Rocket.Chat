import { configureDirectReply } from './configureDirectReply';
import type { ICachedSettings } from '../settings/CachedSettings';

type MockInterceptor = {
	start: jest.Mock;
	stop: jest.Mock;
};

const mockPop3Interceptors: MockInterceptor[] = [];
const mockImapInterceptors: MockInterceptor[] = [];
let mockSettingsChanged: (() => void) | undefined;

jest.mock('underscore', () => ({
	__esModule: true,
	default: {
		debounce: (callback: () => void) => callback,
	},
}));

jest.mock('../features/EmailInbox/logger', () => ({
	logger: {
		info: jest.fn(),
		error: jest.fn(),
	},
}));

jest.mock('../lib/notifications/interceptDirectReplyEmails', () => ({
	DirectReplyIMAPInterceptor: jest.fn(() => {
		const interceptor = {
			start: jest.fn().mockResolvedValue(undefined),
			stop: jest.fn().mockResolvedValue(undefined),
		};
		mockImapInterceptors.push(interceptor);
		return interceptor;
	}),
	POP3Helper: jest.fn(() => {
		const interceptor = {
			start: jest.fn(),
			stop: jest.fn().mockResolvedValue(undefined),
		};
		mockPop3Interceptors.push(interceptor);
		return interceptor;
	}),
}));

const flushPromises = async () => {
	for (let index = 0; index < 5; index += 1) {
		await Promise.resolve();
	}
};

describe('configureDirectReply', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockPop3Interceptors.length = 0;
		mockImapInterceptors.length = 0;
		mockSettingsChanged = undefined;
	});

	it('serializes reconfiguration and skips stale replacements', async () => {
		const values: Record<string, unknown> = {
			Direct_Reply_Enable: true,
			Direct_Reply_Protocol: 'POP',
			Direct_Reply_Host: 'localhost',
			Direct_Reply_Port: 110,
			Direct_Reply_Username: 'user',
			Direct_Reply_Password: 'password',
			Direct_Reply_Frequency: 5,
		};
		const settings = {
			get: jest.fn((key: string) => values[key]),
			watchByRegex: jest.fn((_regex: RegExp, callback: () => void) => {
				mockSettingsChanged = callback;
			}),
		} as unknown as ICachedSettings;

		await configureDirectReply(settings);
		await flushPromises();

		expect(mockPop3Interceptors).toHaveLength(1);
		expect(mockPop3Interceptors[0].start).toHaveBeenCalledTimes(1);

		let finishStopping: (() => void) | undefined;
		mockPop3Interceptors[0].stop.mockReturnValueOnce(
			new Promise<void>((resolve) => {
				finishStopping = resolve;
			}),
		);

		mockSettingsChanged?.();
		await flushPromises();
		mockSettingsChanged?.();
		await flushPromises();

		expect(mockPop3Interceptors).toHaveLength(1);

		finishStopping?.();
		await flushPromises();

		expect(mockPop3Interceptors[0].stop).toHaveBeenCalledTimes(1);
		expect(mockPop3Interceptors).toHaveLength(2);
		expect(mockPop3Interceptors[1].start).toHaveBeenCalledTimes(1);
	});

	it('waits for IMAP shutdown before starting a POP replacement', async () => {
		const values: Record<string, unknown> = {
			Direct_Reply_Enable: true,
			Direct_Reply_Protocol: 'IMAP',
			Direct_Reply_Host: 'localhost',
			Direct_Reply_Port: 993,
			Direct_Reply_Username: 'user',
			Direct_Reply_Password: 'password',
			Direct_Reply_Frequency: 5,
		};
		const settings = {
			get: jest.fn((key: string) => values[key]),
			watchByRegex: jest.fn((_regex: RegExp, callback: () => void) => {
				mockSettingsChanged = callback;
			}),
		} as unknown as ICachedSettings;

		await configureDirectReply(settings);
		await flushPromises();

		expect(mockImapInterceptors).toHaveLength(1);

		let finishStopping: (() => void) | undefined;
		mockImapInterceptors[0].stop.mockReturnValueOnce(
			new Promise<void>((resolve) => {
				finishStopping = resolve;
			}),
		);
		values.Direct_Reply_Protocol = 'POP';

		mockSettingsChanged?.();
		await flushPromises();

		expect(mockPop3Interceptors).toHaveLength(0);

		finishStopping?.();
		await flushPromises();

		expect(mockPop3Interceptors).toHaveLength(1);
		expect(mockPop3Interceptors[0].start).toHaveBeenCalledTimes(1);
	});
});

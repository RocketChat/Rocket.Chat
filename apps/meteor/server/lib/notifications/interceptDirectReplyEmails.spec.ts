import { POP3Helper } from './interceptDirectReplyEmails';

const mockPop3Destroy = jest.fn();
const mockPop3RemoveAllListeners = jest.fn();
let mockPop3CloseListener: (() => void) | undefined;

jest.mock('@rocket.chat/poplib', () => ({
	__esModule: true,
	default: jest.fn(() => ({
		on: jest.fn(),
		once: jest.fn((event, listener) => {
			if (event === 'close') {
				mockPop3CloseListener = listener;
			}
		}),
		destroy: mockPop3Destroy,
		removeAllListeners: mockPop3RemoveAllListeners,
	})),
}));

jest.mock('mailparser', () => ({
	simpleParser: jest.fn(),
}));

jest.mock('./processDirectEmail', () => ({
	processDirectEmail: jest.fn(),
}));

jest.mock('../../email/IMAPInterceptor', () => ({
	IMAPInterceptor: class {},
}));

jest.mock('../../settings', () => ({
	settings: {
		get: jest.fn(),
	},
}));

describe('POP3Helper', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.useFakeTimers();
		mockPop3CloseListener = undefined;
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('closes the active POP3 connection and removes its listeners when stopped', () => {
		const helper = new POP3Helper(5);

		helper.start();
		helper.stop();

		expect(mockPop3Destroy).toHaveBeenCalledTimes(1);
		expect(mockPop3RemoveAllListeners).toHaveBeenCalledTimes(1);
		expect(helper.isActive()).toBe(false);

		mockPop3CloseListener?.();

		expect(mockPop3RemoveAllListeners).toHaveBeenCalledTimes(2);
	});

	it('stops the previous POP3 connection before starting the next poll', () => {
		const helper = new POP3Helper(5);

		helper.start();
		jest.advanceTimersByTime(5 * 60 * 1000);

		expect(mockPop3Destroy).toHaveBeenCalledTimes(1);

		helper.stop();
	});
});

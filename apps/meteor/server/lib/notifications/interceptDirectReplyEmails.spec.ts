import { POP3Helper } from './interceptDirectReplyEmails';

type MockListener = {
	listener: (...args: unknown[]) => void;
	once: boolean;
};

type MockPop3Client = {
	state: number;
	locked: boolean;
	on: jest.Mock;
	once: jest.Mock;
	emit: (event: string, ...args: unknown[]) => void;
	removeAllListeners: jest.Mock;
	getState: jest.Mock;
	getLocked: jest.Mock;
	login: jest.Mock;
	list: jest.Mock;
	retr: jest.Mock;
	dele: jest.Mock;
	quit: jest.Mock;
	destroy: jest.Mock;
};

const mockPop3Clients: MockPop3Client[] = [];

jest.mock('@rocket.chat/poplib', () => ({
	__esModule: true,
	default: jest.fn(() => {
		const listeners = new Map<string, MockListener[]>();
		const client = {
			state: 0,
			locked: false,
			login: jest.fn(),
			list: jest.fn(),
			retr: jest.fn(),
			dele: jest.fn(),
			destroy: jest.fn(),
		} as MockPop3Client;

		client.on = jest.fn((event: string, listener: MockListener['listener']) => {
			listeners.set(event, [...(listeners.get(event) || []), { listener, once: false }]);
			return client;
		});
		client.once = jest.fn((event: string, listener: MockListener['listener']) => {
			listeners.set(event, [...(listeners.get(event) || []), { listener, once: true }]);
			return client;
		});
		client.emit = (event: string, ...args: unknown[]) => {
			const eventListeners = listeners.get(event) || [];
			listeners.set(
				event,
				eventListeners.filter(({ once }) => !once),
			);
			eventListeners.forEach(({ listener }) => listener(...args));
		};
		client.removeAllListeners = jest.fn((event?: string) => {
			if (event) {
				listeners.delete(event);
			} else {
				listeners.clear();
			}
			return client;
		});
		client.getState = jest.fn(() => client.state);
		client.getLocked = jest.fn(() => client.locked);
		client.quit = jest.fn(() => {
			client.locked = true;
		});

		mockPop3Clients.push(client);
		return client;
	}),
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
		mockPop3Clients.length = 0;
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('gracefully closes the active POP3 connection when stopped', async () => {
		const helper = new POP3Helper(5);
		const client = mockPop3Clients[0];
		client.state = 2;

		helper.start();
		const stopping = helper.stop();

		expect(client.quit).toHaveBeenCalledTimes(1);
		expect(client.destroy).not.toHaveBeenCalled();
		expect(helper.isActive()).toBe(false);

		client.emit('close');
		await stopping;

		expect(client.removeAllListeners).toHaveBeenCalledTimes(1);
	});

	it('does not overlap polling connections', () => {
		const helper = new POP3Helper(5);
		const client = mockPop3Clients[0];

		helper.start();
		jest.advanceTimersByTime(5 * 60 * 1000);

		expect(mockPop3Clients).toHaveLength(1);
		expect(client.destroy).not.toHaveBeenCalled();

		client.emit('close');
		jest.advanceTimersByTime(5 * 60 * 1000);

		expect(mockPop3Clients).toHaveLength(2);
	});

	it('waits for an active command before sending QUIT', async () => {
		const helper = new POP3Helper(5);
		const client = mockPop3Clients[0];
		client.state = 2;
		client.locked = true;

		const stopping = helper.stop();

		expect(client.quit).not.toHaveBeenCalled();

		client.locked = false;
		client.emit('dele', true);

		expect(client.quit).toHaveBeenCalledTimes(1);
		expect(client.retr).not.toHaveBeenCalled();

		client.emit('close');
		await stopping;
	});

	it('force-closes a connection when graceful shutdown stalls', async () => {
		const helper = new POP3Helper(5);
		const client = mockPop3Clients[0];
		client.state = 2;
		client.locked = true;

		const stopping = helper.stop();
		jest.advanceTimersByTime(5 * 1000);

		expect(client.destroy).toHaveBeenCalledTimes(1);

		client.emit('close');
		await stopping;
	});

	it('replaces a connection only after it becomes inactive', async () => {
		const helper = new POP3Helper(5);
		const client = mockPop3Clients[0];

		helper.start();
		jest.advanceTimersByTime(10 * 60 * 1000);

		expect(client.destroy).toHaveBeenCalledTimes(1);
		expect(mockPop3Clients).toHaveLength(1);

		client.emit('close');

		expect(mockPop3Clients).toHaveLength(2);

		const replacement = mockPop3Clients[1];
		const stopping = helper.stop();
		replacement.emit('close');
		await stopping;
	});

	it('keeps a connection alive while the server is sending data', () => {
		const helper = new POP3Helper(5);
		const client = mockPop3Clients[0];

		helper.start();
		jest.advanceTimersByTime(9 * 60 * 1000);
		client.emit('activity');
		jest.advanceTimersByTime(9 * 60 * 1000);

		expect(client.destroy).not.toHaveBeenCalled();
		expect(mockPop3Clients).toHaveLength(1);

		jest.advanceTimersByTime(60 * 1000);

		expect(client.destroy).toHaveBeenCalledTimes(1);
	});
});

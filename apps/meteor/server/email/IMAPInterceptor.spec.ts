import { IMAPInterceptor } from './IMAPInterceptor';

type MockIMAP = {
	state: string;
	_sock?: { destroyed?: boolean };
	connect: jest.Mock;
	end: jest.Mock;
	destroy: jest.Mock;
	emit: (event: string, ...args: unknown[]) => boolean;
};

const mockImapInstances: MockIMAP[] = [];

jest.mock('imap', () => {
	const { EventEmitter } = jest.requireActual('node:events');

	return {
		__esModule: true,
		default: class extends EventEmitter {
			state = 'authenticated';

			_sock: { destroyed?: boolean } | undefined;

			connect = jest.fn();

			end = jest.fn();

			destroy = jest.fn();

			constructor() {
				super();
				mockImapInstances.push(this);
			}
		},
	};
});

jest.mock('@rocket.chat/models', () => ({
	EmailInbox: {},
}));

jest.mock('../features/EmailInbox/logger', () => ({
	logger: {
		debug: jest.fn(),
		error: jest.fn(),
		info: jest.fn(),
	},
}));

jest.mock('../lib/notifyListener', () => ({
	notifyOnEmailInboxChanged: jest.fn(),
}));

describe('IMAPInterceptor.stop', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockImapInstances.length = 0;
	});

	it('resolves after an active connection emits end', async () => {
		const interceptor = new IMAPInterceptor({} as never, undefined, 'inbox-id');
		const imap = mockImapInstances[0];
		let stopped = false;

		const stopping = interceptor.stop().then(() => {
			stopped = true;
		});
		await Promise.resolve();

		expect(imap.end).toHaveBeenCalledTimes(1);
		expect(stopped).toBe(false);

		imap.emit('end');
		await stopping;

		expect(stopped).toBe(true);
	});

	it('destroys and awaits a connection that is still being established', async () => {
		const interceptor = new IMAPInterceptor({} as never, undefined, 'inbox-id');
		const imap = mockImapInstances[0];
		imap.state = 'disconnected';
		imap._sock = { destroyed: false };

		const stopping = interceptor.stop();

		expect(imap.destroy).toHaveBeenCalledTimes(1);

		imap.emit('close');
		await stopping;
	});

	it('resolves immediately when already disconnected', async () => {
		const interceptor = new IMAPInterceptor({} as never, undefined, 'inbox-id');
		const imap = mockImapInstances[0];
		imap.state = 'disconnected';

		await interceptor.stop();

		expect(imap.end).not.toHaveBeenCalled();
		expect(imap.destroy).not.toHaveBeenCalled();
	});
});

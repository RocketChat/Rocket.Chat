type StartNatsBroker = typeof import('./nats').startNatsBroker;

const signals = ['SIGTERM', 'SIGINT'] as const;

/** `SKIP_PROCESS_EVENT_REGISTRATION` is read when the module loads, so each test loads its own copy. */
const loadStartNatsBroker = async (skipProcessEventRegistration?: string): Promise<StartNatsBroker> => {
	const previous = process.env.SKIP_PROCESS_EVENT_REGISTRATION;
	if (skipProcessEventRegistration === undefined) {
		delete process.env.SKIP_PROCESS_EVENT_REGISTRATION;
	} else {
		process.env.SKIP_PROCESS_EVENT_REGISTRATION = skipProcessEventRegistration;
	}

	let startNatsBroker: StartNatsBroker = () => {
		throw new Error('nats.ts was not loaded');
	};
	await jest.isolateModulesAsync(async () => {
		({ startNatsBroker } = await import('./nats'));
	});

	if (previous === undefined) {
		delete process.env.SKIP_PROCESS_EVENT_REGISTRATION;
	} else {
		process.env.SKIP_PROCESS_EVENT_REGISTRATION = previous;
	}

	return startNatsBroker;
};

const flushPromises = (): Promise<void> => new Promise((resolve) => setImmediate(resolve));

const listenersBefore = new Map<string, ReturnType<typeof process.listeners>>();

beforeEach(() => {
	signals.forEach((signal) => listenersBefore.set(signal, process.listeners(signal)));
	jest.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
});

// a test that never emits leaves its listeners behind, and the next one would count them
afterEach(() => {
	signals.forEach((signal) => {
		const before = listenersBefore.get(signal) ?? [];

		process
			.listeners(signal)
			.filter((listener) => !before.includes(listener))
			.forEach((listener) => process.removeListener(signal, listener as NodeJS.SignalsListener));
	});
	jest.restoreAllMocks();
});

describe('startNatsBroker', () => {
	it.each(signals)('should stop the broker and exit on %s', async (signal) => {
		const startNatsBroker = await loadStartNatsBroker();
		const stop = jest.spyOn(startNatsBroker('node-a'), 'stop').mockResolvedValue();

		process.emit(signal, signal);
		await flushPromises();

		expect(stop).toHaveBeenCalledTimes(1);
		expect(process.exit).toHaveBeenCalledWith(0);
	});

	it('should exit even when stopping the broker fails', async () => {
		const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
		const startNatsBroker = await loadStartNatsBroker();
		jest.spyOn(startNatsBroker('node-a'), 'stop').mockRejectedValue(new Error('stuck'));

		process.emit('SIGTERM', 'SIGTERM');
		await flushPromises();

		expect(consoleError).toHaveBeenCalledWith('NatsBroker failed to stop', expect.any(Error));
		expect(process.exit).toHaveBeenCalledWith(0);
	});

	it('should not listen for signals when SKIP_PROCESS_EVENT_REGISTRATION is true', async () => {
		const startNatsBroker = await loadStartNatsBroker('true');

		startNatsBroker('node-a');

		signals.forEach((signal) => expect(process.listeners(signal)).toEqual(listenersBefore.get(signal)));
	});
});

import { getMediaDevices, refreshMediaDevices, subscribeToMediaDevices } from './mediaDevicesStore';

const mic = { deviceId: 'yeti', kind: 'audioinput', label: '', groupId: 'usb' } as MediaDeviceInfo;
const namedMic = { ...mic, label: 'Yeti Stereo Microphone' } as MediaDeviceInfo;

const enumerateDevices = jest.fn<Promise<MediaDeviceInfo[]>, []>();
const addEventListener = jest.fn();
const removeEventListener = jest.fn();

beforeAll(() => {
	Object.defineProperty(navigator, 'mediaDevices', {
		configurable: true,
		value: { enumerateDevices, addEventListener, removeEventListener },
	});
});

beforeEach(() => {
	jest.clearAllMocks();
	enumerateDevices.mockResolvedValue([mic]);
});

const flush = () => new Promise((resolve) => setTimeout(resolve));

// One list for the preflight and the call, and no listener left on the browser once neither is showing.
it('listens to the browser from the first reader until the last one leaves', async () => {
	const first = subscribeToMediaDevices(jest.fn());
	const second = subscribeToMediaDevices(jest.fn());

	expect(addEventListener).toHaveBeenCalledTimes(1);
	expect(addEventListener).toHaveBeenCalledWith('devicechange', refreshMediaDevices);
	expect(enumerateDevices).toHaveBeenCalledTimes(1);

	await flush();
	expect(getMediaDevices()).toEqual([mic]);

	first();
	expect(removeEventListener).not.toHaveBeenCalled();

	second();
	expect(removeEventListener).toHaveBeenCalledWith('devicechange', refreshMediaDevices);
	expect(getMediaDevices()).toEqual([]);
});

// Labels only arrive after permission, which the browser does not announce.
it('reads the list again on refresh, and tells its readers', async () => {
	const listener = jest.fn();
	const unsubscribe = subscribeToMediaDevices(listener);
	await flush();

	enumerateDevices.mockResolvedValue([namedMic]);
	refreshMediaDevices();
	await flush();

	expect(getMediaDevices()).toEqual([namedMic]);
	expect(listener).toHaveBeenCalledTimes(2);

	unsubscribe();
});

it('keeps the newest read when an older one answers last', async () => {
	const unsubscribe = subscribeToMediaDevices(jest.fn());
	await flush();

	let answerOlder: (list: MediaDeviceInfo[]) => void = () => undefined;
	enumerateDevices
		.mockReturnValueOnce(
			new Promise((resolve) => {
				answerOlder = resolve;
			}),
		)
		.mockResolvedValueOnce([namedMic]);
	refreshMediaDevices();
	refreshMediaDevices();
	await flush();

	answerOlder([mic]);
	await flush();

	expect(getMediaDevices()).toEqual([namedMic]);
	unsubscribe();
});

it('tells nobody when the list read again is the same', async () => {
	const listener = jest.fn();
	const unsubscribe = subscribeToMediaDevices(listener);
	await flush();
	const before = getMediaDevices();

	enumerateDevices.mockResolvedValue([{ ...mic } as MediaDeviceInfo]);
	refreshMediaDevices();
	await flush();

	expect(listener).toHaveBeenCalledTimes(1);
	expect(getMediaDevices()).toBe(before);
	unsubscribe();
});

// Browsers predating camera and microphone permission queries throw on those names instead of rejecting.
it('still lists the devices when the browser cannot query a capture permission', async () => {
	const query = jest.fn(() => {
		throw new TypeError("'camera' is not a valid PermissionName");
	});
	Object.defineProperty(navigator, 'permissions', { configurable: true, value: { query } });

	const unsubscribe = subscribeToMediaDevices(jest.fn());
	await flush();

	expect(getMediaDevices()).toEqual([mic]);
	unsubscribe();

	Object.defineProperty(navigator, 'permissions', { configurable: true, value: undefined });
});

// Granting a permission names the devices; where the browser announces the grant, the list follows by itself.
it('reads the list again when a capture permission changes, until the last reader leaves', async () => {
	const statuses = new Map<string, { addEventListener: jest.Mock; removeEventListener: jest.Mock }>();
	const query = jest.fn(async ({ name }: { name: string }) => {
		const status = { addEventListener: jest.fn(), removeEventListener: jest.fn() };
		statuses.set(name, status);
		return status;
	});
	Object.defineProperty(navigator, 'permissions', { configurable: true, value: { query } });

	const listener = jest.fn();
	const unsubscribe = subscribeToMediaDevices(listener);
	await flush();

	expect([...statuses.keys()]).toEqual(['microphone', 'camera']);

	// The grant names the devices, so the next read differs and the readers hear of it.
	enumerateDevices.mockResolvedValue([namedMic]);
	const [, onChange] = statuses.get('microphone')?.addEventListener.mock.calls[0] ?? [];
	onChange?.();
	await flush();

	expect(getMediaDevices()).toEqual([namedMic]);
	expect(listener).toHaveBeenCalledTimes(2);

	unsubscribe();
	statuses.forEach((status) => expect(status.removeEventListener).toHaveBeenCalledWith('change', refreshMediaDevices));

	Object.defineProperty(navigator, 'permissions', { configurable: true, value: undefined });
});

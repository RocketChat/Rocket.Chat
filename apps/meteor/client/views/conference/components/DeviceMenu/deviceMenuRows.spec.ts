import { deviceMenuRows, selectedDevice } from './deviceMenuRows';

const device = (deviceId: string, label: string, groupId = deviceId) =>
	({ deviceId, label, groupId, kind: 'audioinput' }) as MediaDeviceInfo;

describe('deviceMenuRows', () => {
	it('puts the system default first, drops its twin and cleans up the names', () => {
		expect(
			deviceMenuRows([
				device('usb', 'Headset (05ac:1107)'),
				device('built-in', 'MacBook Pro Microphone', 'g1'),
				device('default', 'Default - MacBook Pro Microphone', 'g1'),
			]),
		).toEqual([
			{ id: 'default', name: 'MacBook Pro Microphone', systemDefault: true },
			{ id: 'usb', name: 'Headset', systemDefault: false },
		]);
	});
});

describe('selectedDevice', () => {
	const rows = deviceMenuRows([device('a', 'A'), device('b', 'B')]);

	it('is the chosen device, or the first on offer when nothing was chosen', () => {
		expect(selectedDevice(rows, 'b')?.id).toBe('b');
		expect(selectedDevice(rows, undefined)?.id).toBe('a');
	});

	// A device chosen before it was unplugged is not replaced by another in the reader's name.
	it('is nothing when the chosen device is gone', () => {
		expect(selectedDevice(rows, 'gone')).toBeUndefined();
	});
});

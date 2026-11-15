import { deviceMenuRows, deviceMenuSelection, selectedDevice } from './deviceMenuRows';

const device = (deviceId: string, label: string, groupId = deviceId, kind: MediaDeviceKind = 'audioinput') =>
	({ deviceId, label, groupId, kind }) as MediaDeviceInfo;

describe('deviceMenuRows', () => {
	it('puts the system default first, drops its twin and cleans up the names', () => {
		expect(
			deviceMenuRows(
				[
					device('usb', 'Headset (05ac:1107)'),
					device('built-in', 'MacBook Pro Microphone', 'g1'),
					device('default', 'Default - MacBook Pro Microphone', 'g1'),
				],
				'audioinput',
			),
		).toEqual([
			{ id: 'default', name: 'MacBook Pro Microphone', systemDefault: true },
			{ id: 'usb', name: 'Headset', systemDefault: false },
		]);
	});

	it('offers only the devices of the kind asked for', () => {
		expect(deviceMenuRows([device('mic', 'Mic'), device('cam', 'Cam', 'cam', 'videoinput')], 'videoinput')).toEqual([
			{ id: 'cam', name: 'Cam', systemDefault: false },
		]);
	});
});

describe('selectedDevice', () => {
	const rows = deviceMenuRows([device('a', 'A'), device('b', 'B')], 'audioinput');

	it('is the chosen device, or the first on offer when nothing was chosen', () => {
		expect(selectedDevice(rows, 'b')?.id).toBe('b');
		expect(selectedDevice(rows, undefined)?.id).toBe('a');
	});

	// A device chosen before it was unplugged is not replaced by another in the reader's name.
	it('is nothing when the chosen device is gone', () => {
		expect(selectedDevice(rows, 'gone')).toBeUndefined();
	});
});

describe('deviceMenuSelection', () => {
	// A call asked for `default` reports the concrete device it opened, which the menu lists as the alias.
	it('marks the system default when the device in use is its twin', () => {
		const devices = [device('default', 'Default - Built-in', 'g1'), device('built-in', 'Built-in', 'g1'), device('usb', 'Headset')];

		expect(deviceMenuSelection({ devices, selectedIds: { audioinput: 'built-in' } }, 'audioinput').selected?.id).toBe('default');
	});

	it("does not take the speaker's `default` for the microphone's", () => {
		const devices = [
			device('default', 'Default - Built-in', 'g1'),
			device('built-in', 'Built-in', 'g1'),
			device('default', 'Default - Headphones', 'g2', 'audiooutput'),
		];

		expect(deviceMenuSelection({ devices, selectedIds: { audioinput: 'built-in' } }, 'audioinput').selected?.id).toBe('default');
	});
});

import { SYSTEM_DEFAULT_DEVICE_ID, deviceName, isSameDevice, orderAudioDevices, orderDevices } from './deviceLabels';

describe('deviceName', () => {
	// The vendor:product pair identifies the hardware to the machine, not to the person choosing it.
	it('drops the USB id the browser tacks on', () => {
		expect(deviceName('Display Audio (05ac:1107)')).toBe('Display Audio');
		expect(deviceName('FaceTime HD Camera (2C0E:82E3)')).toBe('FaceTime HD Camera');
	});

	// Said properly on a line of its own instead, where it reads as a fact about the device.
	it('drops the "Default - " prefix', () => {
		expect(deviceName('Default - MacBook Pro Microphone')).toBe('MacBook Pro Microphone');
		expect(deviceName('default - Headset')).toBe('Headset');
	});

	it('drops both at once', () => {
		expect(deviceName('Default - Display Audio (05ac:1107)')).toBe('Display Audio');
	});

	// Whitespace around the pair is trimmed rather than matched, which is what keeps the pattern linear in it.
	it('drops the vendor pair however it is spaced', () => {
		expect(deviceName('Display Audio \t (05ac:1107)  ')).toBe('Display Audio');
		expect(deviceName(`Display Audio${'\t'.repeat(2000)}(05ac:1107)`)).toBe('Display Audio');
	});

	// A parenthetical that is part of the name has to survive: only an id pair at the very end is noise.
	it('keeps a parenthetical that belongs to the name', () => {
		expect(deviceName('MacBook Pro Microphone (Built-in)')).toBe('MacBook Pro Microphone (Built-in)');
		expect(deviceName('Camera (05ac:1107) Pro')).toBe('Camera (05ac:1107) Pro');
	});

	it('leaves an ordinary name alone, and copes with an unnamed device', () => {
		expect(deviceName('Logitech BRIO')).toBe('Logitech BRIO');
		expect(deviceName('')).toBe('');
	});
});

describe('orderDevices', () => {
	const device = (deviceId: string, groupId?: string) => ({ deviceId, ...(groupId && { groupId }) });

	// The default is what will be used if nothing is picked, so it is what should be under the cursor.
	it('puts the system default first', () => {
		const ordered = orderDevices([device('abc'), device(SYSTEM_DEFAULT_DEVICE_ID), device('def')]);

		expect(ordered.map(({ deviceId }) => deviceId)).toEqual([SYSTEM_DEFAULT_DEVICE_ID, 'abc', 'def']);
	});

	// Browsers list the default twice — as the alias and under its own id. Offering both is offering the same
	// choice twice, and picking the second silently opts out of following the system later.
	it('drops the twin the default is an alias for, found by group', () => {
		const ordered = orderDevices([device('built-in', 'group-1'), device(SYSTEM_DEFAULT_DEVICE_ID, 'group-1'), device('usb', 'group-2')]);

		expect(ordered.map(({ deviceId }) => deviceId)).toEqual([SYSTEM_DEFAULT_DEVICE_ID, 'usb']);
	});

	// Two displays are routinely called the same thing and are genuinely different devices, which is why the twin
	// is matched by group rather than by name — and why a device with no group is never collapsed into another.
	it('keeps devices that share no group', () => {
		const ordered = orderDevices([device(SYSTEM_DEFAULT_DEVICE_ID), device('one'), device('two')]);

		expect(ordered).toHaveLength(3);
	});

	it('copes with no default at all', () => {
		const ordered = orderDevices([device('one', 'group-1'), device('two', 'group-2')]);

		expect(ordered.map(({ deviceId }) => deviceId)).toEqual(['one', 'two']);
	});
});

// The audio devices the app hands around carry `id` and no `groupId`, so the alias goes first and nothing is
// collapsed — without a group, the only thing left to match a duplicate on is its name, and two devices called the
// same thing are routinely two different devices.
describe('orderAudioDevices', () => {
	const device = (id: string) => ({ id, label: id });

	it('puts the system default first wherever the browser had it', () => {
		const ordered = orderAudioDevices([device('mic-a'), device('mic-b'), device(SYSTEM_DEFAULT_DEVICE_ID)]);

		expect(ordered.map(({ id }) => id)).toEqual([SYSTEM_DEFAULT_DEVICE_ID, 'mic-a', 'mic-b']);
	});

	// Given the browser's own groups, the alias's twin goes — the same rule as for a `MediaDeviceInfo`, just with the
	// group looked up rather than carried.
	it('drops the twin when told which hardware each id belongs to', () => {
		const groups = new Map([
			[SYSTEM_DEFAULT_DEVICE_ID, 'group-1'],
			['built-in', 'group-1'],
			['usb', 'group-2'],
		]);

		const ordered = orderAudioDevices([device('built-in'), device(SYSTEM_DEFAULT_DEVICE_ID), device('usb')], groups);

		expect(ordered.map(({ id }) => id)).toEqual([SYSTEM_DEFAULT_DEVICE_ID, 'usb']);
	});

	// Two microphones of the same model share a name and nothing else. Without groups there is no way to tell that
	// from a duplicate, and a device missing from the list is worse than one listed twice.
	it('keeps everything when it has no groups to go on', () => {
		const ordered = orderAudioDevices([device(SYSTEM_DEFAULT_DEVICE_ID), device('built-in'), device('usb')]);

		expect(ordered).toHaveLength(3);
	});

	it('keeps a device whose group is unknown', () => {
		const groups = new Map([[SYSTEM_DEFAULT_DEVICE_ID, 'group-1']]);

		const ordered = orderAudioDevices([device(SYSTEM_DEFAULT_DEVICE_ID), device('mystery')], groups);

		expect(ordered.map(({ id }) => id)).toEqual([SYSTEM_DEFAULT_DEVICE_ID, 'mystery']);
	});

	it('leaves a list with no default in the order it came', () => {
		const ordered = orderAudioDevices([device('one'), device('two')]);

		expect(ordered.map(({ id }) => id)).toEqual(['one', 'two']);
	});
});

// The pair that made a device in use look unselected: a deduped menu keeps the `default` alias, while the app's own
// selection is whichever of the pair came first out of `enumerateDevices` — usually the concrete one.
describe('isSameDevice', () => {
	const groups = new Map([
		[SYSTEM_DEFAULT_DEVICE_ID, 'group-1'],
		['built-in', 'group-1'],
		['usb', 'group-2'],
	]);

	it('matches the alias with the hardware it stands for', () => {
		expect(isSameDevice(SYSTEM_DEFAULT_DEVICE_ID, 'built-in', groups)).toBe(true);
		expect(isSameDevice('built-in', SYSTEM_DEFAULT_DEVICE_ID, groups)).toBe(true);
	});

	it('matches an id with itself', () => {
		expect(isSameDevice('usb', 'usb', groups)).toBe(true);
	});

	it('keeps two different devices apart', () => {
		expect(isSameDevice('built-in', 'usb', groups)).toBe(false);
	});

	// Two ids that share nothing knowable are two devices: the safe answer when there are no groups.
	it('falls back to plain equality without groups', () => {
		expect(isSameDevice(SYSTEM_DEFAULT_DEVICE_ID, 'built-in')).toBe(false);
		expect(isSameDevice('usb', 'usb')).toBe(true);
	});

	it('matches nothing when either side is missing', () => {
		expect(isSameDevice(undefined, 'usb', groups)).toBe(false);
		expect(isSameDevice('usb', undefined, groups)).toBe(false);
	});
});

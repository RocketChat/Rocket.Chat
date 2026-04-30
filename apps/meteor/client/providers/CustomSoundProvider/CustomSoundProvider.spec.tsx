import { mockAppRoot } from '@rocket.chat/mock-providers';
import { useCustomSound } from '@rocket.chat/ui-contexts';
import { renderHook, act } from '@testing-library/react';
import React from 'react';

import CustomSoundProvider from './CustomSoundProvider';

jest.mock('./lib', () => ({
	defaultSounds: [
		{ _id: 'chime', name: 'Sound_Chime', extension: 'mp3', src: 'sounds/chime.mp3' },
		{ _id: 'door', name: 'Sound_Door', extension: 'mp3', src: 'sounds/door.mp3' },
		{ _id: 'ringtone', name: 'Sound_Ringtone', extension: 'mp3', src: 'sounds/ringtone.mp3' },
	],
	getCustomSoundURL: (sound: { _id: string; extension: string }) => `sounds/${sound._id}.${sound.extension}`,
}));

jest.mock('../../../app/utils/client/lib/SDKClient', () => ({
	sdk: {
		call: jest.fn().mockResolvedValue([]),
	},
}));

jest.mock('@rocket.chat/ui-contexts', () => ({
	...jest.requireActual('@rocket.chat/ui-contexts'),
	useStream: () => () => () => undefined,
}));

jest.mock('../../hooks/useUserSoundPreferences', () => ({
	useUserSoundPreferences: () => ({
		notificationsSoundVolume: 100,
		voipRingerVolume: 100,
	}),
}));

const mockPlay = jest.fn().mockResolvedValue(undefined);
const mockLoad = jest.fn();
const audioInstances: { src: string }[] = [];

class MockAudio {
	src: string;

	id = '';

	volume = 1;

	loop = false;

	constructor(src: string) {
		this.src = src;
		audioInstances.push(this);
	}

	play = mockPlay;

	load = mockLoad;
}

const buildWrapper = (appRootBuilder: ReturnType<typeof mockAppRoot>) => {
	return appRootBuilder.wrap((children) => React.createElement(CustomSoundProvider, null, children)).build();
};

beforeAll(() => {
	Object.defineProperty(global, 'Audio', { value: MockAudio, writable: true });
});

afterEach(() => {
	jest.clearAllMocks();
	audioInstances.length = 0;
});

describe('CustomSoundProvider - play()', () => {
	it('should play the default newMessageNotification sound (ringtone) when soundId is "default"', async () => {
		const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
		const wrapper = buildWrapper(mockAppRoot().withUserPreference('newMessageNotification', 'ringtone'));

		const { result } = renderHook(() => useCustomSound(), { wrapper });

		await act(async () => {
			result.current.play('default');
		});

		expect(mockPlay).toHaveBeenCalledTimes(1);
		expect(audioInstances[0].src).toContain('ringtone');
		expect(consoleSpy).not.toHaveBeenCalled();
		consoleSpy.mockRestore();
	});

	it('should fall back to "chime" when newMessageNotification preference is not set and soundId is "default"', async () => {
		const wrapper = buildWrapper(mockAppRoot());

		const { result } = renderHook(() => useCustomSound(), { wrapper });

		await act(async () => {
			result.current.play('default');
		});

		expect(mockPlay).toHaveBeenCalledTimes(1);
		expect(audioInstances[0].src).toContain('chime');
	});

	it('should play the sound directly when a valid soundId is provided', async () => {
		const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
		const wrapper = buildWrapper(mockAppRoot().withUserPreference('newMessageNotification', 'chime'));

		const { result } = renderHook(() => useCustomSound(), { wrapper });

		await act(async () => {
			result.current.play('door');
		});

		expect(mockPlay).toHaveBeenCalledTimes(1);
		expect(audioInstances[0].src).toContain('door');
		expect(consoleSpy).not.toHaveBeenCalled();
		consoleSpy.mockRestore();
	});

	it('should stop the previous playback when play() is called repeatedly with "default"', async () => {
		const wrapper = buildWrapper(mockAppRoot().withUserPreference('newMessageNotification', 'ringtone'));

		const { result } = renderHook(() => useCustomSound(), { wrapper });

		await act(async () => {
			result.current.play('default');
		});

		expect(mockPlay).toHaveBeenCalledTimes(1);
		expect(mockLoad).not.toHaveBeenCalled();

		await act(async () => {
			result.current.play('default');
		});

		expect(mockPlay).toHaveBeenCalledTimes(2);
		expect(mockLoad).toHaveBeenCalledTimes(1);
	});
});

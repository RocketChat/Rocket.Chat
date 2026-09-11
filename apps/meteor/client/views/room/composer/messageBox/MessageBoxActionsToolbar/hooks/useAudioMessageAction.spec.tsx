import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useAudioMessageAction } from './useAudioMessageAction';

jest.mock('../../../../../../lib/AudioRecorder', () => ({
	AudioRecorder: jest.fn().mockImplementation(() => ({
		isSupported: () => true,
	})),
}));

jest.mock('../../hooks/useMediaPermissions', () => ({
	useMediaPermissions: () => [false, jest.fn()],
}));

const setup = (whiteList: string, blackList = '') =>
	renderHook(() => useAudioMessageAction(false, false), {
		wrapper: mockAppRoot()
			.withSetting('FileUpload_Enabled', true)
			.withSetting('Message_AudioRecorderEnabled', true)
			.withSetting('FileUpload_MediaTypeWhiteList', whiteList)
			.withSetting('FileUpload_MediaTypeBlackList', blackList)
			.build(),
	});

it('enables the audio message action when the whitelist allows audio/mpeg, which is what the recorder actually produces', () => {
	const { result } = setup('audio/mpeg');
	expect(result.current.disabled).toBe(false);
});

it('still enables the audio message action for the legacy audio/mp3 whitelist entry', () => {
	const { result } = setup('audio/mp3');
	expect(result.current.disabled).toBe(false);
});

it('disables the audio message action when neither audio/mpeg nor audio/mp3 is whitelisted', () => {
	const { result } = setup('image/png');
	expect(result.current.disabled).toBe(true);
});

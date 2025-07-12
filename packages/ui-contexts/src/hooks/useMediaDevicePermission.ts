import { useContext } from 'react';

import { DeviceContext, isDeviceContextEnabled } from '../DeviceContext';

export const requestDevice = async ({
	onAccept,
	onReject,
}: {
	onAccept?: (stream: MediaStream) => void;
	onReject?: (error: DOMException) => void;
}): Promise<void> => {
	if (!navigator.mediaDevices) {
		return;
	}
	navigator.mediaDevices.getUserMedia({ audio: true }).then(onAccept, onReject);
};

const isPermissionDenied = (state: PermissionState): state is 'denied' => {
	return state === 'denied';
};

type DeniedReturn = { state: 'denied'; requestDevice?: never };
type PromptOrGrantedReturn = { state: 'prompt' | 'granted'; requestDevice: typeof requestDevice };

/**
 * @description Hook to check if the microphone permission is granted. If the permission is denied, or the permission is not requested, the hook will return a function to request the permission. Right now just the microphone permission is handled with this hook, since DeviceContext is only used for audio input and output.
 * @returns { state: 'granted' } if the permission is granted
 * @returns { state: 'denied' } if the permission is denied
 * @returns { state: 'prompt', requestPrompt: function ({onAccept, onReject}) {} } if the permission is in prompt state.
 */
export const useMediaDeviceMicrophonePermission = (): DeniedReturn | PromptOrGrantedReturn => {
	const context = useContext(DeviceContext);

	if (!isDeviceContextEnabled(context)) {
		return {
			state: 'denied',
		};
	}

	const { permissionStatus, availableAudioInputDevices } = context;

	if (permissionStatus) {
		if (isPermissionDenied(permissionStatus.state)) {
			return { state: permissionStatus.state };
		}

		return { state: permissionStatus.state, requestDevice };
	}

	if (availableAudioInputDevices.length > 0) {
		return { state: 'granted', requestDevice };
	}

	return {
		state: 'prompt',
		requestDevice,
	};
};

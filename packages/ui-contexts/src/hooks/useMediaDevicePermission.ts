import { useContext } from 'react';

import { DeviceContext, isDeviceContextEnabled } from '../DeviceContext';

export const requestPrompt = async ({
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

const isPermissionGrantedOrDenied = (state: PermissionState): state is 'granted' | 'denied' => {
	return state === 'granted' || state === 'denied';
};

type GrantedOrDeniedReturn = { state: 'granted' | 'denied'; requestPrompt?: never };
type PromptReturn = { state: 'prompt'; requestPrompt: typeof requestPrompt };

/**
 * @description Hook to check if the microphone permission is granted. If the permission is denied, or the permission is not requested, the hook will return a function to request the permission. Right now just the microphone permission is handled with this hook, since DeviceContext is only used for audio input and output.
 * @returns { state: 'granted' } if the permission is granted
 * @returns { state: 'denied' } if the permission is denied
 * @returns { state: 'prompt', requestPrompt: function ({onAccept, onReject}) {} } if the permission is in prompt state.
 */
export const useMediaDeviceMicrophonePermission = (): GrantedOrDeniedReturn | PromptReturn => {
	const context = useContext(DeviceContext);

	if (!isDeviceContextEnabled(context)) {
		return {
			state: 'denied',
		};
	}

	const { permissionStatus, availableAudioInputDevices } = context;

	if (permissionStatus) {
		if (isPermissionGrantedOrDenied(permissionStatus.state)) {
			return { state: permissionStatus.state };
		}

		return { state: permissionStatus.state, requestPrompt };
	}

	if (availableAudioInputDevices.length > 0) {
		return { state: 'granted' };
	}

	return {
		state: 'prompt',
		requestPrompt,
	};
};

import { Modal } from '@rocket.chat/fuselage';
import { useMediaDeviceMicrophonePermission, useSetModal } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

type UseDevicePermissionPromptProps = {
	onAccept?: (stream?: MediaStream) => void;
	onReject?: (error: DOMException) => void;
	actionType: 'outgoing' | 'incoming' | 'device-change';
};

const getOutgoingModal = (
	state: PermissionState,
	{ onAccept, onReject }: Pick<UseDevicePermissionPromptProps, 'onAccept' | 'onReject'>,
) => {
	console.log(onAccept, onReject);
	if (state === 'denied') {
		return <Modal></Modal>;
	}

	if (state === 'prompt') {
		return <Modal></Modal>;
	}

	throw new Error('ui-voip - useDevicePermissionPrompt - getOutgoingModal - invalid permission state');
};

const getIncomingModal = (
	state: PermissionState,
	{ onAccept, onReject }: Pick<UseDevicePermissionPromptProps, 'onAccept' | 'onReject'>,
) => {
	console.log(onAccept, onReject);

	if (state === 'denied') {
		return <Modal></Modal>;
	}

	if (state === 'prompt') {
		return <Modal></Modal>;
	}

	throw new Error('ui-voip - useDevicePermissionPrompt - getIncomingModal - invalid permission state');
};

const getDeviceChangeModal = (
	state: PermissionState,
	{ onAccept, onReject }: Pick<UseDevicePermissionPromptProps, 'onAccept' | 'onReject'>,
) => {
	console.log(onAccept, onReject);

	if (state === 'granted') {
		onAccept?.();
		return;
	}

	if (state === 'denied') {
		return <Modal></Modal>;
	}

	if (state === 'prompt') {
		return <Modal></Modal>;
	}

	throw new Error('ui-voip - useDevicePermissionPrompt - getDeviceChangeModal - invalid permission state');
};

export const useDevicePermissionPrompt = ({ onAccept, onReject, actionType }: UseDevicePermissionPromptProps) => {
	const { state, requestPrompt } = useMediaDeviceMicrophonePermission();
	const setModal = useSetModal();

	return useCallback(() => {
		if (state === 'granted' && actionType !== 'device-change') {
			onAccept?.();
			return;
		}

		const onAcceptCallback = () => {
			if (!requestPrompt) {
				return;
			}

			requestPrompt({
				onReject,
				onAccept,
			});
		};

		if (actionType === 'device-change') {
			setModal(getDeviceChangeModal(state, { onAccept: onAcceptCallback, onReject }));
		}

		if (actionType === 'outgoing') {
			setModal(getOutgoingModal(state, { onAccept: onAcceptCallback, onReject }));
		}

		if (actionType === 'incoming') {
			setModal(getIncomingModal(state, { onAccept: onAcceptCallback, onReject }));
		}
	}, [state, actionType, onAccept, setModal, onReject, requestPrompt]);
};

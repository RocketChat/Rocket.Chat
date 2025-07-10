import { useMediaDeviceMicrophonePermission, useSetModal } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import PermissionFlowModal, { type PermissionFlowModalType } from '../components/PermissionFlow/PermissionFlowModal';

type OnAccept = (stream: MediaStream) => void;
type OnReject = (error?: DOMException) => void;

type DeviceChangePromptProps = {
	onAccept: OnAccept;
	onReject?: OnReject;
	actionType: 'device-change';
};

type OutgoingPromptProps = {
	onAccept: OnAccept;
	onReject?: OnReject;
	actionType: 'outgoing';
};

type IncomingPromptProps = {
	onAccept: OnAccept;
	onReject: OnReject;
	actionType: 'incoming';
};

type UseDevicePermissionPromptProps = DeviceChangePromptProps | OutgoingPromptProps | IncomingPromptProps;

const getModalType = (
	actionType: UseDevicePermissionPromptProps['actionType'],
	state: Exclude<PermissionState, 'granted'>,
): PermissionFlowModalType => {
	if (state === 'denied') {
		return 'denied';
	}

	if (actionType === 'device-change') {
		return 'deviceChangePrompt';
	}

	if (actionType === 'outgoing') {
		return 'outgoingPrompt';
	}

	// actionType === 'incoming'
	return 'incomingPrompt';
};

export const useDevicePermissionPrompt = ({ onAccept, onReject, actionType }: UseDevicePermissionPromptProps) => {
	const { state, requestDevice } = useMediaDeviceMicrophonePermission();
	const setModal = useSetModal();

	return useCallback(() => {
		if (state === 'granted') {
			requestDevice({
				onAccept,
			});
			return;
		}

		const onConfirm = () => {
			requestDevice?.({
				onReject,
				onAccept: (...args) => {
					onAccept(...args);
					setModal(null);
				},
			});
		};

		const onCancel = () => {
			if (onReject) {
				onReject();
			}
			setModal(null);
		};

		setModal(<PermissionFlowModal type={getModalType(actionType, state)} onCancel={onCancel} onConfirm={onConfirm} />);
	}, [state, actionType, onAccept, setModal, onReject, requestDevice]);
};

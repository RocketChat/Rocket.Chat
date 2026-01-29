import { useMediaDeviceMicrophonePermission, useSelectedDevices, useSetInputMediaDevice, useSetModal } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { PermissionFlowModal, type PermissionFlowModalType } from '../views';

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

export const stopTracks = (stream: MediaStream) => {
	stream.getTracks().forEach((track) => {
		track.stop();
	});
};

export class PermissionRequestCancelledCallRejectedError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'PermissionRequestDeniedError';
	}
}

// TODO: Remove this hook
export const useDevicePermissionPrompt = ({ onAccept: _onAccept, onReject, actionType }: UseDevicePermissionPromptProps) => {
	const { state, requestDevice } = useMediaDeviceMicrophonePermission();
	const setModal = useSetModal();
	const setInputMediaDevice = useSetInputMediaDevice();
	const queryClient = useQueryClient();

	return useCallback(
		(stopTracks = true) => {
			const onAccept = (stream: MediaStream) => {
				// Since we now have requested a stream, we can now invalidate the devices list and generate a complete one.
				// Obs2: Safari does not seem to be dispatching the change event when permission is granted, so we need to invalidate the permission query as well.
				queryClient.invalidateQueries({ queryKey: ['media-devices-list'] });

				stream.getTracks().forEach((track) => {
					const { deviceId } = track.getSettings();
					if (!deviceId) {
						return;
					}

					if (track.kind === 'audio' && navigator.mediaDevices.enumerateDevices) {
						navigator.mediaDevices.enumerateDevices().then((devices) => {
							const device = devices.find((device) => device.deviceId === deviceId);
							if (!device) {
								return;
							}
							setInputMediaDevice({
								id: device.deviceId,
								label: device.label,
								type: 'audioinput',
							});
						});
					}
				});
				_onAccept(stream);

				// For now we only need this stream to be able to list the devices (firefox doesn't list devices without a stream)
				// and also to get the selected device from the tracks settings (firefox requests permission per device)
				// This is set as a flag in case we need to use the stream in the future.
				if (stopTracks) {
					stream.getTracks().forEach((track) => {
						track.stop();
					});
				}
			};

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
		},
		[state, setModal, actionType, queryClient, _onAccept, setInputMediaDevice, requestDevice, onReject],
	);
};

export const useDevicePermissionPrompt2 = () => {
	const { state, requestDevice } = useMediaDeviceMicrophonePermission();
	const setModal = useSetModal();
	const setInputMediaDevice = useSetInputMediaDevice();
	const queryClient = useQueryClient();
	const { audioInput } = useSelectedDevices() || {};

	const selectedDeviceId = audioInput?.id;

	return useCallback(
		async ({
			constraints: _constraints,
			actionType,
		}: {
			constraints?: MediaStreamConstraints;
			actionType: 'outgoing' | 'incoming' | 'device-change';
		}) => {
			return new Promise<MediaStream>((_resolve, reject) => {
				const resolve = (stream: MediaStream) => {
					// Since we now have requested a stream, we can now invalidate the devices list and generate a complete one.
					// Obs2: Safari does not seem to be dispatching the change event when permission is granted, so we need to invalidate the permission query as well.
					queryClient.invalidateQueries({ queryKey: ['media-devices-list'] });
					_resolve(stream);
				};

				const onAccept = (stream: MediaStream) => {
					stream.getTracks().forEach((track) => {
						const { deviceId } = track.getSettings();
						if (!deviceId) {
							return;
						}

						if (track.kind === 'audio' && navigator.mediaDevices.enumerateDevices) {
							navigator.mediaDevices.enumerateDevices().then((devices) => {
								const device = devices.find((device) => device.deviceId === deviceId);
								if (!device) {
									return;
								}
								setInputMediaDevice({
									id: device.deviceId,
									label: device.label,
									type: 'audioinput',
								});
							});
						}
					});
					resolve(stream);
				};

				const constraints = _constraints || {
					audio: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : true,
				};

				if (state === 'granted') {
					requestDevice({
						onAccept: resolve,
						onReject: reject,
						constraints,
					});
					return;
				}

				const onConfirm = () => {
					requestDevice?.({
						onReject: (...args) => {
							reject(...args);
							setModal(<PermissionFlowModal type='denied' onCancel={() => setModal(null)} onConfirm={() => setModal(null)} />);
						},
						onAccept: (...args) => {
							onAccept(...args);
							setModal(null);
						},
						constraints,
					});
				};

				const modalType = getModalType(actionType, state);

				const onCancel = () => {
					if (modalType === 'incomingPrompt') {
						reject(new PermissionRequestCancelledCallRejectedError('Permission request modal closed'));
					}

					setModal(null);
				};
				setModal(<PermissionFlowModal type={modalType} onCancel={onCancel} onConfirm={onConfirm} />);
			});
		},
		[selectedDeviceId, state, setModal, queryClient, setInputMediaDevice, requestDevice],
	);
};

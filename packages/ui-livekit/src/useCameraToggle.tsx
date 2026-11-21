import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { CameraWithoutEffectModal } from '@rocket.chat/ui-conference';
import { useSetModal } from '@rocket.chat/ui-contexts';
import type { LocalParticipant, LocalVideoTrack, Room } from 'livekit-client';
import { useEffect, useState } from 'react';

import { processorOf } from './backgroundEffects/effectProcessor';
import { publishCameraWithEffect } from './backgroundEffects/publishCameraWithEffect';
import type { BackgroundEffectControl } from './backgroundEffects/useBackgroundEffect';
import type { useArrivalHoldBack } from './useArrivalHoldBack';

type UseCameraToggleOptions = {
	room: Room;
	localParticipant: LocalParticipant;
	cameraTrack?: LocalVideoTrack;
	camEnabled: boolean;
	connected: boolean;
	deviceId?: string;
	background: BackgroundEffectControl;
	arrival: ReturnType<typeof useArrivalHoldBack>;
	/** The camera was turned on or off. */
	onToggled: (cam: boolean) => void;
	onError: (error: unknown) => void;
};

/** Turns the camera on and off without ever sending the room while a background effect is wanted. */
export const useCameraToggle = ({
	room,
	localParticipant,
	cameraTrack,
	camEnabled,
	connected,
	deviceId,
	background,
	arrival,
	onToggled,
	onError,
}: UseCameraToggleOptions) => {
	const setModal = useSetModal();
	const [cameraStarting, setCameraStarting] = useState(false);
	// After an effect failed to start, turning the camera on without one asks first.
	const [askBeforeBareCamera, setAskBeforeBareCamera] = useState(false);

	const setCameraEnabled = (enabled: boolean) => {
		localParticipant.setCameraEnabled(enabled).then(() => onToggled(enabled), onError);
	};

	const startWithEffect = useStableCallback(async () => {
		if (cameraStarting) {
			return;
		}
		setCameraStarting(true);
		try {
			await publishCameraWithEffect(room, localParticipant, background, deviceId);
			arrival.markPublished();
			onToggled(true);
		} catch (err) {
			console.warn('the camera could not start with its background effect', err);
			background.reportStartFailure();
			setAskBeforeBareCamera(true);
		} finally {
			setCameraStarting(false);
		}
	});

	const { takeHeldBackCamera } = arrival;
	useEffect(() => {
		if (connected && !camEnabled && takeHeldBackCamera()) {
			void startWithEffect();
		}
	}, [connected, camEnabled, takeHeldBackCamera, startWithEffect]);

	const enableBareCamera = () => {
		setAskBeforeBareCamera(false);
		setCameraEnabled(true);
	};

	const turnOn = () => {
		if (background.wanted.kind !== 'none') {
			// A processor that has produced frames already keeps the reopened camera processed.
			if (processorOf(cameraTrack)?.framed) {
				setCameraEnabled(true);
				return;
			}
			void startWithEffect();
			return;
		}
		if (!askBeforeBareCamera) {
			enableBareCamera();
			return;
		}
		setModal(
			<CameraWithoutEffectModal
				onConfirm={() => {
					setModal(null);
					enableBareCamera();
				}}
				onCancel={() => setModal(null)}
			/>,
		);
	};

	const toggleCamera = useStableCallback(() => {
		if (cameraStarting) {
			return;
		}
		if (camEnabled) {
			setCameraEnabled(false);
			return;
		}
		turnOn();
	});

	return { cameraStarting, toggleCamera };
};

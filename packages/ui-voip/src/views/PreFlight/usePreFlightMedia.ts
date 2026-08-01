import { useCallback, useEffect, useRef, useState } from 'react';

import { useAudioLevel } from '../../providers/useAudioLevel';

export type PreFlightPermission = 'unknown' | 'prompting' | 'granted' | 'denied';

export type PreFlightJoinPreferences = {
	mic: boolean;
	cam: boolean;
	audioDeviceId?: string;
	videoDeviceId?: string;
};

export type PreFlightMedia = {
	micEnabled: boolean;
	camEnabled: boolean;
	toggleMic: () => void;
	toggleCam: () => void;
	micPermission: PreFlightPermission;
	camPermission: PreFlightPermission;
	hasMicDevice: boolean;
	hasCamDevice: boolean;
	/** true while an OS permission prompt may be on screen — Join must be disabled */
	prompting: boolean;
	/** local camera preview; null when the camera is off/blocked/absent */
	previewStream: MediaStream | null;
	/** 0–1 level of the live mic, for the visual-only mic check */
	micLevel: number;
	audioInputs: MediaDeviceInfo[];
	audioOutputs: MediaDeviceInfo[];
	videoInputs: MediaDeviceInfo[];
	selectedAudioInputId: string | undefined;
	selectedVideoInputId: string | undefined;
	selectedAudioOutputId: string | undefined;
	selectAudioInput: (deviceId: string) => void;
	selectVideoInput: (deviceId: string) => void;
	selectAudioOutput: (deviceId: string) => void;
	/** the preferences to carry into the call on Join */
	getJoinPreferences: () => PreFlightJoinPreferences;
	/** stops every local track — call when handing the devices over to the call */
	releaseDevices: () => void;
};

const stopStream = (stream: MediaStream | null) => {
	stream?.getTracks().forEach((track) => track.stop());
};

const queryPermission = async (name: 'microphone' | 'camera'): Promise<PermissionState | undefined> => {
	try {
		const status = await navigator.permissions?.query({ name: name as PermissionName });
		return status?.state;
	} catch {
		// Firefox doesn't support querying camera/microphone yet
		return undefined;
	}
};

/**
 * Local device state for the pre-flight screen. Owns the camera preview and
 * mic level-meter streams, the OS permission lifecycle and the device
 * selection that is later handed to the call transport.
 *
 * Spec notes (Figma "Pre flight"): joining must NEVER be blocked by device
 * state — a denied permission or missing device only flips the matching
 * button to its danger state. The single exception is while an OS permission
 * prompt is (possibly) on screen, when Join is disabled so the prompt stays
 * tied to the user's action. A deny is final for the session: we never
 * re-prompt, we point to browser settings instead.
 */
export const usePreFlightMedia = (initialMic: boolean, initialCam: boolean): PreFlightMedia => {
	const [micEnabled, setMicEnabled] = useState(initialMic);
	const [camEnabled, setCamEnabled] = useState(initialCam);
	const [micPermission, setMicPermission] = useState<PreFlightPermission>('unknown');
	const [camPermission, setCamPermission] = useState<PreFlightPermission>('unknown');
	const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
	const [micStream, setMicStream] = useState<MediaStream | null>(null);
	const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
	const [selectedAudioInputId, setSelectedAudioInputId] = useState<string | undefined>(undefined);
	const [selectedVideoInputId, setSelectedVideoInputId] = useState<string | undefined>(undefined);
	const [selectedAudioOutputId, setSelectedAudioOutputId] = useState<string | undefined>(undefined);

	const micStreamRef = useRef<MediaStream | null>(null);
	const previewStreamRef = useRef<MediaStream | null>(null);

	const refreshDevices = useCallback(() => {
		navigator.mediaDevices
			?.enumerateDevices()
			.then(setDevices)
			.catch(() => undefined);
	}, []);

	useEffect(() => {
		refreshDevices();
		navigator.mediaDevices?.addEventListener?.('devicechange', refreshDevices);
		return () => {
			navigator.mediaDevices?.removeEventListener?.('devicechange', refreshDevices);
		};
	}, [refreshDevices]);

	useEffect(() => {
		let cancelled = false;
		void queryPermission('microphone').then((state) => {
			if (!cancelled && state === 'denied') setMicPermission('denied');
		});
		void queryPermission('camera').then((state) => {
			if (!cancelled && state === 'denied') setCamPermission('denied');
		});
		return () => {
			cancelled = true;
		};
	}, []);

	const audioInputs = devices.filter((d) => d.kind === 'audioinput');
	const audioOutputs = devices.filter((d) => d.kind === 'audiooutput');
	const videoInputs = devices.filter((d) => d.kind === 'videoinput');
	const hasMicDevice = audioInputs.length > 0;
	const hasCamDevice = videoInputs.length > 0;

	// Mic acquisition: powers the visual level meter only — pre-flight is
	// silent, nothing is transmitted before Join.
	useEffect(() => {
		if (!micEnabled || micPermission === 'denied' || !hasMicDevice) {
			stopStream(micStreamRef.current);
			micStreamRef.current = null;
			setMicStream(null);
			return;
		}

		let cancelled = false;
		setMicPermission((current) => (current === 'granted' ? current : 'prompting'));
		navigator.mediaDevices
			.getUserMedia({ audio: selectedAudioInputId ? { deviceId: { exact: selectedAudioInputId } } : true })
			.then((stream) => {
				if (cancelled) {
					stopStream(stream);
					return;
				}
				setMicPermission('granted');
				stopStream(micStreamRef.current);
				micStreamRef.current = stream;
				setMicStream(stream);
				// after a grant, labels become available
				refreshDevices();
			})
			.catch((error: unknown) => {
				if (cancelled) return;
				if ((error as DOMException)?.name === 'NotAllowedError') {
					setMicPermission('denied');
				} else {
					setMicPermission('unknown');
				}
				setMicEnabled(false);
			});

		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [micEnabled, micPermission === 'denied', hasMicDevice, selectedAudioInputId, refreshDevices]);

	// Camera acquisition: local mirrored preview.
	useEffect(() => {
		if (!camEnabled || camPermission === 'denied' || !hasCamDevice) {
			stopStream(previewStreamRef.current);
			previewStreamRef.current = null;
			setPreviewStream(null);
			return;
		}

		let cancelled = false;
		setCamPermission((current) => (current === 'granted' ? current : 'prompting'));
		navigator.mediaDevices
			.getUserMedia({ video: selectedVideoInputId ? { deviceId: { exact: selectedVideoInputId } } : true })
			.then((stream) => {
				if (cancelled) {
					stopStream(stream);
					return;
				}
				setCamPermission('granted');
				stopStream(previewStreamRef.current);
				previewStreamRef.current = stream;
				setPreviewStream(stream);
				refreshDevices();
			})
			.catch((error: unknown) => {
				if (cancelled) return;
				if ((error as DOMException)?.name === 'NotAllowedError') {
					setCamPermission('denied');
				} else {
					setCamPermission('unknown');
				}
				setCamEnabled(false);
			});

		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [camEnabled, camPermission === 'denied', hasCamDevice, selectedVideoInputId, refreshDevices]);

	// Release everything on unmount.
	useEffect(() => {
		return () => {
			stopStream(micStreamRef.current);
			stopStream(previewStreamRef.current);
		};
	}, []);

	const toggleMic = useCallback(() => {
		// a deny is final — the button tooltip points to browser settings
		if (micPermission === 'denied' || !hasMicDevice) return;
		setMicEnabled((enabled) => !enabled);
	}, [micPermission, hasMicDevice]);

	const toggleCam = useCallback(() => {
		if (camPermission === 'denied' || !hasCamDevice) return;
		setCamEnabled((enabled) => !enabled);
	}, [camPermission, hasCamDevice]);

	const micLevel = useAudioLevel(micStream);

	const getJoinPreferences = useCallback(
		(): PreFlightJoinPreferences => ({
			mic: micEnabled && micPermission === 'granted',
			cam: camEnabled && camPermission === 'granted',
			audioDeviceId: selectedAudioInputId,
			videoDeviceId: selectedVideoInputId,
		}),
		[micEnabled, micPermission, camEnabled, camPermission, selectedAudioInputId, selectedVideoInputId],
	);

	const releaseDevices = useCallback(() => {
		stopStream(micStreamRef.current);
		micStreamRef.current = null;
		setMicStream(null);
		stopStream(previewStreamRef.current);
		previewStreamRef.current = null;
		setPreviewStream(null);
	}, []);

	return {
		micEnabled: micEnabled && micPermission !== 'denied' && hasMicDevice,
		camEnabled: camEnabled && camPermission !== 'denied' && hasCamDevice,
		toggleMic,
		toggleCam,
		micPermission,
		camPermission,
		hasMicDevice,
		hasCamDevice,
		prompting: micPermission === 'prompting' || camPermission === 'prompting',
		previewStream,
		micLevel,
		audioInputs,
		audioOutputs,
		videoInputs,
		selectedAudioInputId,
		selectedVideoInputId,
		selectedAudioOutputId,
		selectAudioInput: setSelectedAudioInputId,
		selectVideoInput: setSelectedVideoInputId,
		selectAudioOutput: setSelectedAudioOutputId,
		getJoinPreferences,
		releaseDevices,
	};
};

import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { Device, DeviceContextValue } from '@rocket.chat/ui-contexts';
import { DeviceContext } from '@rocket.chat/ui-contexts';
import { useMediaDevices } from '@rocket.chat/ui-media';
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useState, useMemo } from 'react';

import { isSetSinkIdAvailable } from './lib/isSetSinkIdAvailable';

export type DeviceProviderProps = {
	children?: ReactNode | undefined;
};

const defaultDevices = {
	audioInput: [],
	audioOutput: [],
	defaultAudioOutputDevice: {
		id: '',
		label: '',
		type: 'audiooutput',
	},
	defaultAudioInputDevice: {
		id: '',
		label: '',
		type: 'audioinput',
	},
};

// Invalidated by the permission prompt, since Safari does not announce the grant.
const permissionStatusQueryKey = ['media-devices-list', 'permission-status'];

export const DeviceProvider = ({ children }: DeviceProviderProps) => {
	const [enabled] = useState(typeof isSecureContext && isSecureContext);
	const [selectedAudioOutputDevice, setSelectedAudioOutputDevice] = useState<Device | undefined>(undefined);
	const [selectedAudioInputDevice, setSelectedAudioInputDevice] = useState<Device | undefined>(undefined);

	const setAudioInputDevice = (device: Device): void => {
		if (!isSecureContext) {
			throw new Error('Device Changes are not available on insecure contexts');
		}
		setSelectedAudioInputDevice(device);
	};

	const setAudioOutputDevice = useStableCallback(
		({ outputDevice, HTMLAudioElement }: { outputDevice: Device; HTMLAudioElement: HTMLAudioElement }): void => {
			if (!isSetSinkIdAvailable()) {
				throw new Error('setSinkId is not available in this browser');
			}
			if (!enabled) {
				throw new Error('Device Changes are not available on insecure contexts');
			}
			setSelectedAudioOutputDevice(outputDevice);
			HTMLAudioElement.setSinkId(outputDevice.id);
		},
	);

	const { devices } = useMediaDevices();

	const data = useMemo(() => {
		if (devices.length === 0) {
			return defaultDevices;
		}

		const mappedDevices: Device[] = devices.map((device) => ({
			id: device.deviceId,
			label: device.label,
			type: device.kind,
		}));

		const filteredInput = mappedDevices.filter((device) => device.type === 'audioinput');

		const filteredOutput = mappedDevices.filter((device) => device.type === 'audiooutput');

		const audioInput = filteredInput.length > 0 ? filteredInput : [defaultDevices.defaultAudioInputDevice];
		const audioOutput = filteredOutput.length > 0 ? filteredOutput : [defaultDevices.defaultAudioOutputDevice];

		return {
			audioInput,
			audioOutput,
			defaultAudioOutputDevice: audioOutput[0],
			defaultAudioInputDevice: audioInput[0],
		};
	}, [devices]);

	const { data: permissionStatus } = useQuery({
		queryKey: permissionStatusQueryKey,
		queryFn: async () => {
			if (!navigator.permissions) {
				return;
			}
			const result = await navigator.permissions.query({ name: 'microphone' });
			return result;
		},
		initialData: undefined,
		placeholderData: undefined,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
		refetchOnMount: true,
	});

	const contextValue = useMemo((): DeviceContextValue => {
		if (!enabled) {
			return {
				enabled,
			};
		}
		const { audioInput, audioOutput, defaultAudioOutputDevice, defaultAudioInputDevice } = data;

		return {
			enabled,
			permissionStatus,
			availableAudioOutputDevices: audioOutput,
			availableAudioInputDevices: audioInput,
			selectedAudioOutputDevice: selectedAudioOutputDevice || defaultAudioOutputDevice,
			selectedAudioInputDevice: selectedAudioInputDevice || defaultAudioInputDevice,
			setAudioOutputDevice,
			setAudioInputDevice,
		};
	}, [enabled, data, permissionStatus, selectedAudioOutputDevice, selectedAudioInputDevice, setAudioOutputDevice]);

	return <DeviceContext.Provider value={contextValue}>{children}</DeviceContext.Provider>;
};

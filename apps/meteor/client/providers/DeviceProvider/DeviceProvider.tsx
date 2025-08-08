import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { Device, DeviceContextValue } from '@rocket.chat/ui-contexts';
import { DeviceContext } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import type { ReactElement, ReactNode } from 'react';
import { useEffect, useState, useMemo } from 'react';

import { isSetSinkIdAvailable } from './lib/isSetSinkIdAvailable';

type DeviceProviderProps = {
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

const devicesQueryKey = ['media-devices-list'];

export const DeviceProvider = ({ children }: DeviceProviderProps): ReactElement => {
	const [enabled] = useState(typeof isSecureContext && isSecureContext);
	const [selectedAudioOutputDevice, setSelectedAudioOutputDevice] = useState<Device | undefined>(undefined);
	const [selectedAudioInputDevice, setSelectedAudioInputDevice] = useState<Device | undefined>(undefined);

	const setAudioInputDevice = (device: Device): void => {
		if (!isSecureContext) {
			throw new Error('Device Changes are not available on insecure contexts');
		}
		setSelectedAudioInputDevice(device);
	};

	const setAudioOutputDevice = useEffectEvent(
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

	const queryClient = useQueryClient();

	const { data } = useQuery({
		queryKey: devicesQueryKey,
		enabled,
		queryFn: async () => {
			const devices = await navigator.mediaDevices?.enumerateDevices();
			if (!devices || devices.length === 0) {
				return defaultDevices;
			}

			const mappedDevices: Device[] = devices.map((device) => ({
				id: device.deviceId,
				label: device.label,
				type: device.kind,
			}));

			const audioInput = mappedDevices.filter((device) => device.type === 'audioinput');

			const audioOutput = mappedDevices.filter((device) => device.type === 'audiooutput');

			return {
				audioInput,
				audioOutput,
				defaultAudioOutputDevice: audioOutput[0],
				defaultAudioInputDevice: audioInput[0],
			};
		},
		initialData: defaultDevices,
		placeholderData: keepPreviousData,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
		refetchOnMount: true,
		staleTime: 0,
	});

	const { data: permissionStatus } = useQuery({
		queryKey: [...devicesQueryKey, 'permission-status'],
		queryFn: async () => {
			if (!navigator.permissions) {
				return;
			}
			const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
			return result;
		},
		initialData: undefined,
		placeholderData: undefined,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
		refetchOnMount: true,
	});

	useEffect(() => {
		if (!permissionStatus) {
			return;
		}
		const invalidateQueries = (): void => {
			queryClient.invalidateQueries({ queryKey: devicesQueryKey });
		};

		permissionStatus.addEventListener('change', invalidateQueries);

		return (): void => {
			permissionStatus.removeEventListener('change', invalidateQueries);
		};
	}, [permissionStatus, queryClient]);

	useEffect(() => {
		if (!enabled || !navigator.mediaDevices) {
			return;
		}

		const invalidateQuery = (): void => {
			queryClient.invalidateQueries({ queryKey: devicesQueryKey, exact: true });
		};

		navigator.mediaDevices.addEventListener('devicechange', invalidateQuery);

		return (): void => {
			navigator.mediaDevices.removeEventListener('devicechange', invalidateQuery);
		};
	}, [enabled, queryClient]);

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

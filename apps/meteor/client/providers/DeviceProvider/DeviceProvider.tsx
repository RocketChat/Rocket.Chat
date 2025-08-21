import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { Device, DeviceContextValue } from '@rocket.chat/ui-contexts';
import { DeviceContext } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';
import { useEffect, useState, useMemo } from 'react';

import { isSetSinkIdAvailable } from './lib/isSetSinkIdAvailable';

type DeviceProviderProps = {
	children?: ReactNode;
};

export const DeviceProvider = ({ children }: DeviceProviderProps): ReactElement => {
	const [enabled] = useState(typeof isSecureContext !== 'undefined' && isSecureContext);
	const [availableAudioOutputDevices, setAvailableAudioOutputDevices] = useState<Device[]>([]);
	const [availableAudioInputDevices, setAvailableAudioInputDevices] = useState<Device[]>([]);
	const [selectedAudioOutputDevice, setSelectedAudioOutputDevice] = useState<Device>({
		id: 'default',
		label: '',
		type: 'audio',
	});
	const [selectedAudioInputDevice, setSelectedAudioInputDevice] = useState<Device>({
		id: 'default',
		label: '',
		type: 'audio',
	});

	const setAudioInputDevice = (device: Device): void => {
		if (!enabled) {
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
			HTMLAudioElement.setSinkId(outputDevice.id).catch((error) => {
				console.error('Error setting audio output device:', error);
			});
		},
	);

	useEffect(() => {
		if (!enabled) {
			return;
		}
		const setMediaDevices = (): void => {
			navigator.mediaDevices?.enumerateDevices()
				.then((devices) => {
					const audioInput: Device[] = [];
					const audioOutput: Device[] = [];
					devices.forEach((device) => {
						const mediaDevice: Device = {
							id: device.deviceId,
							label: device.label || 'Unknown Device',
							type: device.kind,
						};
						if (device.kind === 'audioinput') {
							audioInput.push(mediaDevice);
						} else if (device.kind === 'audiooutput') {
							audioOutput.push(mediaDevice);
						}
					});
					setAvailableAudioOutputDevices(audioOutput);
					setAvailableAudioInputDevices(audioInput);
				})
				.catch((error) => {
					console.error('Error fetching media devices:', error);
				});
		};

		navigator.mediaDevices?.addEventListener('devicechange', setMediaDevices);
		setMediaDevices();

		return (): void => {
			navigator.mediaDevices?.removeEventListener('devicechange', setMediaDevices);
		};
	}, [enabled]);

	const contextValue = useMemo((): DeviceContextValue => ({
		enabled,
		availableAudioOutputDevices,
		availableAudioInputDevices,
		selectedAudioOutputDevice,
		selectedAudioInputDevice,
		setAudioOutputDevice,
		setAudioInputDevice,
	}), [
		availableAudioInputDevices,
		availableAudioOutputDevices,
		selectedAudioInputDevice,
		selectedAudioOutputDevice,
	]);

	return <DeviceContext.Provider value={contextValue}>{children}</DeviceContext.Provider>;
};

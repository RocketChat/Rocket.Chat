import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { DeviceContext, Device, IExperimentalHTMLAudioElement, DeviceContextValue } from '@rocket.chat/ui-contexts';
import React, { ReactElement, ReactNode, useEffect, useState, useMemo } from 'react';

import { isSetSinkIdAvailable } from './lib/isSetSinkIdAvailable';

type DeviceProviderProps = {
	children?: ReactNode | undefined;
};

export const DeviceProvider = ({ children }: DeviceProviderProps): ReactElement => {
	const [enabled] = useState(typeof isSecureContext && isSecureContext);
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
		if (!isSecureContext) {
			throw new Error('Device Changes are not available on insecure contexts');
		}
		setSelectedAudioInputDevice(device);
	};

	const setAudioOutputDevice = useMutableCallback(
		({ outputDevice, HTMLAudioElement }: { outputDevice: Device; HTMLAudioElement: IExperimentalHTMLAudioElement }): void => {
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

	useEffect(() => {
		if (!enabled) {
			return;
		}
		const setMediaDevices = (): void => {
			navigator.mediaDevices?.enumerateDevices().then((devices) => {
				const audioInput: Device[] = [];
				const audioOutput: Device[] = [];
				devices.forEach((device) => {
					const mediaDevice: Device = {
						id: device.deviceId,
						label: device.label,
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
			});
		};

		navigator.mediaDevices?.addEventListener('devicechange', setMediaDevices);
		setMediaDevices();

		return (): void => {
			navigator.mediaDevices?.removeEventListener('devicechange', setMediaDevices);
		};
	}, [enabled]);

	const contextValue = useMemo((): DeviceContextValue => {
		if (!enabled) {
			return {
				enabled,
			};
		}

		return {
			enabled,
			availableAudioOutputDevices,
			availableAudioInputDevices,
			selectedAudioOutputDevice,
			selectedAudioInputDevice,
			setAudioOutputDevice,
			setAudioInputDevice,
		};
	}, [
		availableAudioInputDevices,
		availableAudioOutputDevices,
		enabled,
		selectedAudioInputDevice,
		selectedAudioOutputDevice,
		setAudioOutputDevice,
	]);
	return <DeviceContext.Provider value={contextValue}>{children}</DeviceContext.Provider>;
};

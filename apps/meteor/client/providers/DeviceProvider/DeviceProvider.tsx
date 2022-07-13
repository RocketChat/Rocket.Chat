import { DeviceContext, Device, IExperimentalHTMLAudioElement } from '@rocket.chat/ui-contexts';
import React, { ReactElement, ReactNode, useEffect, useState } from 'react';

import { isSetSinkIdAvailable } from './lib/isSetSinkIdAvailable';

type DeviceProviderProps = {
	children?: ReactNode | undefined;
};

export const DeviceProvider = ({ children }: DeviceProviderProps): ReactElement => {
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

	const setAudioOutputDevice = ({
		outputDevice,
		HTMLAudioElement,
	}: {
		outputDevice: Device;
		HTMLAudioElement: IExperimentalHTMLAudioElement;
	}): void => {
		if (!isSetSinkIdAvailable()) {
			throw new Error('setSinkId is not available in this browser');
		}
		setSelectedAudioOutputDevice(outputDevice);
		HTMLAudioElement.setSinkId(outputDevice.id);
	};

	useEffect(() => {
		const setMediaDevices = (): void => {
			navigator.mediaDevices.enumerateDevices().then((devices) => {
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

		navigator.mediaDevices.addEventListener('devicechange', setMediaDevices);
		setMediaDevices();

		return (): void => {
			navigator.mediaDevices.removeEventListener('devicechange', setMediaDevices);
		};
	}, []);

	const contextValue = {
		availableAudioOutputDevices,
		availableAudioInputDevices,
		selectedAudioOutputDevice,
		selectedAudioInputDevice,
		setAudioOutputDevice,
		setAudioInputDevice: setSelectedAudioInputDevice,
	};
	return <DeviceContext.Provider value={contextValue}>{children}</DeviceContext.Provider>;
};

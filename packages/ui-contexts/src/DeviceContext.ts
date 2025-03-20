import { createContext } from 'react';

export type Device = {
	id: string;
	label: string;
	type: string;
};

type EnabledDeviceContextValue = {
	enabled: true;
	availableAudioOutputDevices: Device[];
	availableAudioInputDevices: Device[];
	// availableVideoInputDevices: Device[]
	selectedAudioOutputDevice?: Device;
	selectedAudioInputDevice?: Device;
	// selectedVideoInputDevice?: Device;
	setAudioOutputDevice: (data: { outputDevice: Device; HTMLAudioElement: HTMLAudioElement }) => void;
	setAudioInputDevice: (device: Device) => void;
	// setVideoInputDevice: (device: Device) => void;
};

type DisabledDeviceContextValue = {
	enabled: false;
};

export type DeviceContextValue = EnabledDeviceContextValue | DisabledDeviceContextValue;

export const isDeviceContextEnabled = (context: DeviceContextValue): context is EnabledDeviceContextValue =>
	(context as EnabledDeviceContextValue).enabled;

export const DeviceContext = createContext<DeviceContextValue>({
	enabled: false,
});

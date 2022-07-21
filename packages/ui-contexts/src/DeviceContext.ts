import { createContext } from 'react';

export type Device = {
	id: string;
	label: string;
	type: string;
};

export interface IExperimentalHTMLAudioElement extends HTMLAudioElement {
	setSinkId: (sinkId: string) => void;
}

type DeviceContextValue = {
	availableAudioOutputDevices: Device[];
	availableAudioInputDevices: Device[];
	// availableVideoInputDevices: Device[]
	selectedAudioOutputDevice?: Device;
	selectedAudioInputDevice?: Device;
	// selectedVideoInputDevice?: Device;
	setAudioOutputDevice: (data: { outputDevice: Device; HTMLAudioElement: IExperimentalHTMLAudioElement }) => void;
	setAudioInputDevice: (device: Device) => void;
	// setVideoInputDevice: (device: Device) => void;
};

export const DeviceContext = createContext<DeviceContextValue>({
	availableAudioOutputDevices: [],
	availableAudioInputDevices: [],
	// availableVideoInputDevices: [],
	selectedAudioOutputDevice: {
		id: 'default',
		label: '',
		type: 'audio',
	},
	selectedAudioInputDevice: {
		id: 'default',
		label: '',
		type: 'audio',
	},
	// selectedVideoInputDevice: undefined,
	setAudioOutputDevice: () => undefined,
	setAudioInputDevice: () => undefined,
	// setVideoInputDevice: () => undefined,
});

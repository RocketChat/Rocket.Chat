export interface IDevice {
	id: string;
	label: string;
	type: string;
}

export interface IDeviceInfo {
	audioOutputDevices: IDevice[];
	audioInputDevices: IDevice[];
	videoInputDevices: IDevice[];
}

export interface ISelectedDevices {
	audioOutputDevice: IDevice;
	audioInputDevice: IDevice;
	videoInputDevice?: IDevice;
}

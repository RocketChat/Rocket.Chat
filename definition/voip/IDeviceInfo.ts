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

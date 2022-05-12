import { Emitter } from '@rocket.chat/emitter';

import { DeviceEvents } from '../../../definition/voip/DeviceEvents';
import { IDeviceInfo, IDevice } from '../../../definition/voip/IDeviceInfo';

export class DeviceManager extends Emitter<DeviceEvents> {
	deviceInfo: IDeviceInfo = {
		audioOutputDevices: [],
		audioInputDevices: [],
		videoInputDevices: [],
	};

	constructor() {
		super();
		navigator.mediaDevices.addEventListener('devicechange', async (event) => {
			console.error(`ROCKETCHAT_DEBUG device change${JSON.stringify(event)}`);
			await this.fetchAvailableDevices();
			this.emit('devicechanged');
		});
		this.fetchAvailableDevices();
	}

	async fetchAvailableDevices(): Promise<void> {
		if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
			console.error('enumerateDevices() not supported.');
			return;
		}
		const devices = await navigator.mediaDevices.enumerateDevices();
		this.deviceInfo.audioInputDevices = [];
		this.deviceInfo.audioOutputDevices = [];
		this.deviceInfo.videoInputDevices = [];
		devices.forEach((device) => {
			console.log(`ROCKETCHAT_DEBUG${JSON.stringify(device)}`);
			const mediaDevice: IDevice = {
				id: device.deviceId,
				label: device.label,
				type: device.kind,
			};
			if (device.kind === 'audioinput') {
				this.deviceInfo.audioInputDevices.push(mediaDevice);
			} else if (device.kind === 'audiooutput') {
				this.deviceInfo.audioOutputDevices.push(mediaDevice);
			} else if (device.kind === 'videoinput') {
				this.deviceInfo.videoInputDevices.push(mediaDevice);
			}
		});
	}

	async getMediaDevices(): Promise<IDeviceInfo | undefined> {
		return this.deviceInfo;
	}
}

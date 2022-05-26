import { DeviceEvents, IDeviceInfo, IDevice, ISelectedDevices, VoIPUserConfiguration } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';

// import { IDeviceInfo, IDevice } from '../../../definition/voip/IDeviceInfo';

export class DeviceManager extends Emitter<DeviceEvents> {
	deviceInfo: IDeviceInfo = {
		audioOutputDevices: [],
		audioInputDevices: [],
		videoInputDevices: [],
	};

	private selectedDevices: ISelectedDevices;

	constructor(private readonly config: VoIPUserConfiguration) {
		super();
		navigator.mediaDevices.addEventListener('devicechange', async (event) => {
			console.error(`ROCKETCHAT_DEBUG device change${JSON.stringify(event)}`);
			await this.fetchAvailableDevices();
			this.emit('devicechanged');
		});
		this.fetchAvailableDevices();
		this.selectedDevices = {
			audioInputDevice: {
				id: 'default',
				label: '',
				type: 'audio',
			},
			audioOutputDevice: {
				id: 'default',
				label: '',
				type: 'audio',
			},
		};
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

	setSelectedDevices(selectedDevices: ISelectedDevices): void {
		this.selectedDevices = selectedDevices;
	}

	changeAudioInputDevice(selectedAudioDevices: IDevice): void {
		this.selectedDevices.audioInputDevice = selectedAudioDevices;
	}

	changeAudioOutputDevice(selectedAudioDevices: IDevice): void {
		this.selectedDevices.audioOutputDevice = selectedAudioDevices;
	}

	changeVideoInputDevice(selectedVideoDevices: IDevice): void {
		this.selectedDevices.videoInputDevice = selectedVideoDevices;
	}

	hasVideoInputDevice(): boolean {
		return !!this.selectedDevices.videoInputDevice;
	}

	getAudioOutputDeviceId(): string {
		return this.selectedDevices.audioOutputDevice.id;
	}

	getConstraints(mediaType?: 'audio' | 'video'): MediaStreamConstraints {
		switch (mediaType) {
			case 'audio': {
				return {
					audio:
						this.selectedDevices.audioInputDevice.id === 'default'
							? true
							: { deviceId: { exact: this.selectedDevices.audioInputDevice.id } },
				};
			}
			case 'video': {
				if (!this.config.enableVideo) {
					return {
						video: false,
					};
				}
				return {
					video:
						this.selectedDevices.videoInputDevice?.id === 'default'
							? true
							: { deviceId: { exact: this.selectedDevices.videoInputDevice?.id } },
				};
			}
			default: {
				const constraints: {
					audio: boolean | Record<string, any>;
					video: boolean | Record<string, any>;
				} = {
					audio:
						this.selectedDevices.audioInputDevice.id === 'default'
							? true
							: { deviceId: { exact: this.selectedDevices.audioInputDevice.id } },
					video: false,
				};
				if (this.config.enableVideo) {
					constraints.video =
						this.selectedDevices.videoInputDevice?.id === 'default'
							? true
							: { deviceId: { exact: this.selectedDevices.videoInputDevice?.id } };
				}
				return constraints;
			}
		}
	}
}

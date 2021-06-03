import { types } from 'mediasoup';

interface IWebRtcTransportOptions extends types.WebRtcTransportOptions {
	maxIncomingBitrate: number;
	minimumAvailableOutgoingBitrate: number;
}

export interface ISFUConfig {
	mediasoup: {
		numWorkers: number;
		workerSettings: types.WorkerSettings;
		routerOptions: types.RouterOptions;
		webRtcTransportOptions: IWebRtcTransportOptions;
	};
}

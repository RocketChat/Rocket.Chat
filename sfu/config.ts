import os from 'os';

import { ISFUConfig } from './types/ISFUConfig';

const config: ISFUConfig = {
	// Signaling settings (protoo WebSocket server and HTTP API server).
	// https:
	// {
	// 	listenIp: '0.0.0.0',
	// 	// NOTE: Don't change listenPort (client app assumes 4443).
	// 	listenPort: process.env.PROTOO_LISTEN_PORT || 4443,
	// 	// NOTE: Set your own valid certificate files.
	// 	tls:
	// 	{
	// 		cert: process.env.HTTPS_CERT_FULLCHAIN || `${ __dirname }/certs/fullchain.pem`,
	// 		key: process.env.HTTPS_CERT_PRIVKEY || `${ __dirname }/certs/privkey.pem`,
	// 	},
	// },
	// mediasoup settings.
	mediasoup:
	{
		// Number of mediasoup workers to launch.
		numWorkers: Object.keys(os.cpus()).length,
		// mediasoup WorkerSettings.
		// See https://mediasoup.org/documentation/v3/mediasoup/api/#WorkerSettings
		workerSettings:
		{
			logLevel: 'warn',
			logTags:
			[
				'info',
				'ice',
				'dtls',
				'rtp',
				'srtp',
				'rtcp',
				'rtx',
				'bwe',
				'score',
				'simulcast',
				'svc',
				'sctp',
			],
			rtcMinPort: 40000,
			rtcMaxPort: 49999,
		},
		// mediasoup Router options.
		// See https://mediasoup.org/documentation/v3/mediasoup/api/#RouterOptions
		routerOptions:
		{
			mediaCodecs:
			[
				{
					kind: 'audio',
					mimeType: 'audio/opus',
					clockRate: 48000,
					channels: 2,
				},
			],
		},
		// mediasoup WebRtcTransport options for WebRTC endpoints (mediasoup-client,
		// libmediasoupclient).
		// See https://mediasoup.org/documentation/v3/mediasoup/api/#WebRtcTransportOptions
		webRtcTransportOptions:
		{
			listenIps:
			[
				{
					ip: '127.0.0.1', // @TODO: Set correct IP/use enviornment variable
					announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP,
				},
			],
			initialAvailableOutgoingBitrate: 1000000,
			minimumAvailableOutgoingBitrate: 600000,
			maxSctpMessageSize: 262144,
			// Additional options that are not part of WebRtcTransportOptions.
			maxIncomingBitrate: 1500000,
		},
		// mediasoup PlainTransport options for legacy RTP endpoints (FFmpeg,
		// GStreamer).
		// See https://mediasoup.org/documentation/v3/mediasoup/api/#PlainTransportOptions
		// plainTransportOptions:
		// {
		// 	listenIp:
		// 	{
		// 		ip: process.env.MEDIASOUP_LISTEN_IP || '1.2.3.4',
		// 		announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP,
		// 	},
		// 	maxSctpMessageSize: 262144,
		// },
	},
};

export default config;

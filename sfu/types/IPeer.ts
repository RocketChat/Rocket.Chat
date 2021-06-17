import { Peer } from 'protoo-server';
import { types } from 'mediasoup';

export interface IPeer extends Peer {
	data: {
		consume?: boolean;
		joined?: boolean;
		displayName?: string;
		device?: string;
		rtpCapabilities?: types.RtpCapabilities;

		transports: Map<string|number, types.Transport>;
		producers: Map<string|number, types.Producer>;
		consumers: Map<string|number, types.Consumer>;
	};
}

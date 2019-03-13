import { Logger } from '/app/logger';

export const logger = new Logger('Federation', {
	sections: {
		resource: 'Resource',
		setup: 'Setup',
		peerClient: 'Peer Client',
		peerServer: 'Peer Server',
		dns: 'DNS',
		http: 'HTTP',
	},
});

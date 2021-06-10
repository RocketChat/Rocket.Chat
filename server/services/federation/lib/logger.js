import { Logger } from '../../../utils/logger';

export const logger = new Logger('Federation', {
	sections: {
		client: 'client',
		crypt: 'crypt',
		dns: 'dns',
		http: 'http',
		server: 'server',
		setup: 'Setup',
	},
});

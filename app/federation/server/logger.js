import { Logger } from '../../logger';

export const logger = new Logger('Federation', {
	sections: {
		client: 'client',
		dns: 'dns',
		http: 'http',
		server: 'server',
		setup: 'Setup',
	},
});

import { Logger } from '../../../logger/server';

export const logger = new Logger('Federation', {
	sections: {
		client: 'client',
		dns: 'dns',
		http: 'http',
		server: 'server',
		setup: 'Setup',
	},
});

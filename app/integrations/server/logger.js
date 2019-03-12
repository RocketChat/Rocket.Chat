import { Logger } from '/app/logger';

export const logger = new Logger('Integrations', {
	sections: {
		incoming: 'Incoming WebHook',
		outgoing: 'Outgoing WebHook',
	},
});

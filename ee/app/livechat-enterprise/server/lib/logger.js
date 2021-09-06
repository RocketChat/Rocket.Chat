import { Logger } from '../../../../../app/logger/server/server';

export const logger = new Logger('LivechatEnterprise', {
	sections: {
		queries: 'Queries',
		queue: 'Queue',
		helper: 'Helper',
		cb: 'Callbacks',
	},
});

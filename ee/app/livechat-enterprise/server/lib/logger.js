import { Logger } from '../../../../../server/utils/logger/server';

export const logger = new Logger('LivechatEnterprise', {
	sections: {
		queries: 'Queries',
	},
});

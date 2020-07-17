import { Logger } from '../../../logger/server';

export const logger = new Logger('Events', {
	sections: {
		dispatcher: 'dispatcher',
	},
});

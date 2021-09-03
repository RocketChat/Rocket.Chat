import { Logger } from '../../../logger/server';

export const deprecationLogger = new Logger('DeprecationWarning', {
	sections: {
		api: 'API',
		method: 'METHOD',
		function: 'FUCNTION',
	},
});

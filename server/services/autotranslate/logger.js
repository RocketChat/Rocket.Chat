import { Logger } from '../../../app/logger';

export const logger = new Logger('AutoTranslate', {
	sections: {
		google: 'Google',
		deepl: 'DeepL',
		microsoft: 'Microsoft',
	},
});

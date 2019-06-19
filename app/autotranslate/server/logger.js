import { Logger } from '../../logger';

export const logger = new Logger('AutoTranslate', {
	sections: {
		google: 'Google',
		deepl: 'DeepL',
	},
});

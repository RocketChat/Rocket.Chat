import { onStartup } from '../../../server/lib/onStartup';
import { settingsRegistry } from '../../settings/server';

onStartup(async () => {
	const enableQuery = {
		_id: 'Katex_Enabled',
		value: true,
	};
	await settingsRegistry.add('Katex_Enabled', true, {
		type: 'boolean',
		group: 'Message',
		section: 'Katex',
		public: true,
		i18nDescription: 'Katex_Enabled_Description',
	});
	await settingsRegistry.add('Katex_Parenthesis_Syntax', true, {
		type: 'boolean',
		group: 'Message',
		section: 'Katex',
		public: true,
		enableQuery,
		i18nDescription: 'Katex_Parenthesis_Syntax_Description',
	});
	await settingsRegistry.add('Katex_Dollar_Syntax', false, {
		type: 'boolean',
		group: 'Message',
		section: 'Katex',
		public: true,
		enableQuery,
		i18nDescription: 'Katex_Dollar_Syntax_Description',
	});
});

import type { Keys as IconName } from '@rocket.chat/icons';
import type { TranslationKey } from '@rocket.chat/ui-contexts';

import { settings } from '../../../settings/client';

export type FormattingButton =
	| {
			label: TranslationKey;
			icon: IconName;
			pattern: string;
			// text?: () => string | undefined;
			command?: string;
			link?: string;
			condition?: () => boolean;
	  }
	| {
			label: TranslationKey;
			text: () => string | undefined;
			link: string;
			condition?: () => boolean;
	  };

export const formattingButtons: ReadonlyArray<FormattingButton> = [
	{
		label: 'Bold',
		icon: 'bold',
		pattern: '*{{text}}*',
		command: 'b',
	},
	{
		label: 'Italic',
		icon: 'italic',
		pattern: '_{{text}}_',
		command: 'i',
	},
	{
		label: 'Strike',
		icon: 'strike',
		pattern: '~{{text}}~',
	},
	{
		label: 'Inline_code',
		icon: 'code',
		pattern: '`{{text}}`',
	},
	{
		label: 'Multi_line',
		icon: 'multiline',
		pattern: '```\n{{text}}\n``` ',
	},
	{
		label: 'KaTeX' as TranslationKey,
		icon: 'katex',
		text: () => {
			if (!settings.get('Katex_Enabled')) {
				return;
			}
			if (settings.get('Katex_Dollar_Syntax')) {
				return '$$KaTeX$$';
			}
			if (settings.get('Katex_Parenthesis_Syntax')) {
				return '\\[KaTeX\\]';
			}
		},
		link: 'https://khan.github.io/KaTeX/function-support.html',
		condition: () => settings.get('Katex_Enabled'),
	},
] as const;

import type { Keys as IconName } from '@rocket.chat/icons';
import { imperativeModal } from '@rocket.chat/ui-client';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { flushSync } from 'react-dom';

import AddLinkComposerActionModal from './AddLinkComposerActionModal';
import type { LinePrefix } from './toggleLinePrefix';
import { ORDERED_LINE_PREFIX, UNORDERED_LINE_PREFIX } from './toggleLinePrefix';
import type { ComposerAPI } from '../../../../client/lib/chats/ChatAPI';
import { settings } from '../../../../client/lib/settings';

type FormattingButtonDefault = { label: TranslationKey; condition?: () => boolean };

type TextButton = {
	text: () => string | undefined;
	link: string;
} & FormattingButtonDefault;

type PatternButton = {
	icon: IconName;
	pattern: string;
	// text?: () => string | undefined;
	command?: string;
	link?: string;
} & FormattingButtonDefault;

type PromptButton = {
	prompt: (composer: ComposerAPI) => void;
	icon: IconName;
} & FormattingButtonDefault;

type LinePrefixButton = {
	linePrefix: LinePrefix;
	icon: IconName;
} & FormattingButtonDefault;

export type FormattingButton = PatternButton | PromptButton | TextButton | LinePrefixButton;

export const isPromptButton = (button: FormattingButton): button is PromptButton => 'prompt' in button;

export const isLinePrefixButton = (button: FormattingButton): button is LinePrefixButton => 'linePrefix' in button;

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
		label: 'Strikethrough',
		icon: 'strike',
		pattern: '~{{text}}~',
	},
	{
		label: 'Inline_code',
		icon: 'code',
		pattern: '`{{text}}`',
	},
	{
		label: 'Multi_line_code',
		icon: 'multiline',
		pattern: '```\n{{text}}\n``` ',
	},
	{
		label: 'Bulleted_list',
		icon: 'list-bullets',
		linePrefix: UNORDERED_LINE_PREFIX,
	},
	{
		label: 'Numbered_list',
		icon: 'list-numbers',
		linePrefix: ORDERED_LINE_PREFIX,
	},
	{
		label: 'Link',
		icon: 'link',
		prompt: (composerApi: ComposerAPI) => {
			const { selection } = composerApi;

			const selectedText = composerApi.substring(selection.start, selection.end);

			const onClose = () => {
				imperativeModal.close();
				composerApi.focus();
			};

			const onConfirm = (url: string, text: string) => {
				// Composer API can't handle the selection of the text while the modal is open
				flushSync(() => {
					onClose();
				});
				flushSync(() => {
					composerApi.replaceText(`[${text}](${url})`, selection);
					composerApi.setCursorToEnd();
				});
			};

			imperativeModal.open({ component: AddLinkComposerActionModal, props: { onConfirm, selectedText, onClose } });
		},
	},
	{
		label: 'KaTeX' as TranslationKey,
		icon: 'katex',
		text: () => {
			if (!settings.peek('Katex_Enabled')) {
				return;
			}
			if (settings.peek('Katex_Dollar_Syntax')) {
				return '$$KaTeX$$';
			}
			if (settings.peek('Katex_Parenthesis_Syntax')) {
				return '\\[KaTeX\\]';
			}
		},
		link: 'https://khan.github.io/KaTeX/function-support.html',
		condition: () => settings.peek('Katex_Enabled') ?? true,
	},
] as const;

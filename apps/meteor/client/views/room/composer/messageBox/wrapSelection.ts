import type { ComposerAPI } from '../../../../lib/chats/ChatAPI';

const wrapSelectionPatterns: Record<string, string> = {
	'`': '`{{text}}`',
	'"': '"{{text}}"',
	"'": "'{{text}}'",
	'(': '({{text}})',
	'<': '<{{text}}>',
	'{': '{{{text}}}',
	'[': '[{{text}}]',
	'*': '*{{text}}*',
};

export const handleSelectionWrapping = (event: KeyboardEvent, composer: ComposerAPI): boolean => {
	const input = event.target as HTMLTextAreaElement;
	const { selectionStart, selectionEnd } = input;

	if (selectionStart === selectionEnd) {
		return false;
	}

	const pattern = wrapSelectionPatterns[event.key];
	if (!pattern) {
		return false;
	}

	event.preventDefault();
	composer.wrapSelection(pattern);
	return true;
};

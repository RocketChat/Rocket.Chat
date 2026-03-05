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

export const handleSelectionWrapping = (event: InputEvent, composer: ComposerAPI): boolean => {
	if (event.inputType !== 'insertText' || event.isComposing) {
		return false;
	}

	const input = event.target as HTMLTextAreaElement;
	const { selectionStart, selectionEnd } = input;

	if (selectionStart === selectionEnd) {
		return false;
	}

	const key = event.data;
	if (!key) {
		return false;
	}

	const pattern = wrapSelectionPatterns[key];
	if (!pattern) {
		return false;
	}

	event.preventDefault();
	composer.wrapSelection(pattern);
	return true;
};

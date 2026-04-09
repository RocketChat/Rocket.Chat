import type { ChatAPI } from '../../../../lib/chats/ChatAPI';

const wrapSelectionPatterns: Record<string, string> = {
	'`': '`{{text}}`',
	'"': '"{{text}}"',
	"'": "'{{text}}'",
	'(': '({{text}})',
	'<': '<{{text}}>',
	'{': '{{{text}}}',
	'[': '[{{text}}]',
	'*': '*{{text}}*',
	'_': '_{{text}}_',
	'~': '~{{text}}~',
	'˜': '~{{text}}~',
};

const once = (target: EventTarget, eventName: string, callback: (event: Event) => void) => {
	const handleEvent = (e: Event) => {
		callback(e);
		target.removeEventListener(eventName, handleEvent);
	};
	target.addEventListener(eventName, handleEvent);
};

export const handleSelectionWrapping = (event: InputEvent, chat: ChatAPI): boolean => {
	const { composer } = chat;
	if (!composer) {
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

	const selection = composer.wrapSelection(pattern);
	// this is a workaround when we are using MAC
	if (event.isComposing) {
		once(input, 'input', (event) => {
			input.value = selection.value;
			input.setSelectionRange(selection.selectionStart, selection.selectionEnd);
			event.preventDefault();
		});
	}

	event.preventDefault();
	return true;
};

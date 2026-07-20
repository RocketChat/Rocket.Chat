import { getSelectionRange, setSelectionRange } from '../../../../../app/ui-message/client/messageBox/selectionRange';
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

	const testSelection = input.value.slice(selectionStart, selectionEnd);
	// if the selection is the same of the data, return false
	if (testSelection === event.data) {
		return false;
	}
	if (event.data === chat.composer?.text) {
		return false;
	}
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

// contenteditable divs have no .value/.selectionStart, so selection has to be read via the Selection API
export const handleRichTextSelectionWrapping = (event: InputEvent, chat: ChatAPI): boolean => {
	const { composer } = chat;
	if (!composer) {
		return false;
	}
	const input = event.target as HTMLDivElement;
	const { selectionStart, selectionEnd } = getSelectionRange(input);

	const testSelection = input.innerText.slice(selectionStart, selectionEnd);
	// if the selection is the same of the data, return false
	if (testSelection === event.data) {
		return false;
	}
	if (event.data === chat.composer?.text) {
		return false;
	}
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
	if (event.isComposing) {
		once(input, 'input', (event) => {
			input.innerText = selection.value;
			setSelectionRange(input, selection.selectionStart, selection.selectionEnd);
			event.preventDefault();
		});
	}

	event.preventDefault();
	return true;
};

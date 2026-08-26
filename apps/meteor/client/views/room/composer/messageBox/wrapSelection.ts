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

type WrapSelectionTarget = {
	node: EventTarget;
	getText: () => string;
	getSelection: () => { selectionStart: number; selectionEnd: number };
	restore: (value: string, selectionStart: number, selectionEnd: number) => void;
};

const wrapSelectionWith = (event: InputEvent, chat: ChatAPI, target: WrapSelectionTarget): boolean => {
	const { composer } = chat;
	if (!composer) {
		return false;
	}

	const { selectionStart, selectionEnd } = target.getSelection();

	const testSelection = target.getText().slice(selectionStart, selectionEnd);
	// if the selection is the same of the data, return false
	if (testSelection === event.data) {
		return false;
	}
	if (event.data === composer.text) {
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
		once(target.node, 'input', (event) => {
			target.restore(selection.value, selection.selectionStart, selection.selectionEnd);
			event.preventDefault();
		});
	}

	event.preventDefault();
	return true;
};

export const handleSelectionWrapping = (event: InputEvent, chat: ChatAPI): boolean => {
	const input = event.target as HTMLTextAreaElement;

	return wrapSelectionWith(event, chat, {
		node: input,
		getText: () => input.value,
		getSelection: () => ({ selectionStart: input.selectionStart, selectionEnd: input.selectionEnd }),
		restore: (value, selectionStart, selectionEnd) => {
			input.value = value;
			input.setSelectionRange(selectionStart, selectionEnd);
		},
	});
};

// contenteditable divs have no .value/.selectionStart, so selection has to be read via the Selection API
export const handleRichTextSelectionWrapping = (event: InputEvent, chat: ChatAPI): boolean => {
	const input = event.target as HTMLDivElement;

	return wrapSelectionWith(event, chat, {
		node: input,
		getText: () => input.innerText,
		getSelection: () => getSelectionRange(input),
		restore: (value, selectionStart, selectionEnd) => {
			input.innerText = value;
			setSelectionRange(input, selectionStart, selectionEnd);
		},
	});
};

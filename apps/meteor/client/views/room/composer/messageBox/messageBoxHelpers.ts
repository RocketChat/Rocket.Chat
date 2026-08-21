import type { ComposerAPI } from '../../../../lib/chats/ChatAPI';
import type { FormattingButton } from '../../../../lib/messageBoxFormatting';

export const emptySubscribe = () => () => undefined;
export const getEmptyFalse = () => false;
const a: any[] = [];
export const getEmptyArray = () => a;

export const isCmdOrCtrlPressed = (event: { metaKey: boolean; ctrlKey: boolean }) => {
	const isMacOS = navigator.platform.indexOf('Mac') !== -1;

	return (isMacOS && event.metaKey) || (!isMacOS && event.ctrlKey);
};

export const handleFormattingShortcut = (
	event: KeyboardEvent,
	formattingButtons: FormattingButton[],
	composer: ComposerAPI,
	preventDefault = false,
) => {
	if (!isCmdOrCtrlPressed(event)) {
		return false;
	}

	const key = event.key.toLowerCase();

	const formatter = formattingButtons.find((formatter) => 'command' in formatter && formatter.command === key);

	if (!formatter || !('pattern' in formatter)) {
		return false;
	}

	if (preventDefault) {
		event.preventDefault();
	}

	composer.wrapSelection(formatter.pattern);
	return true;
};

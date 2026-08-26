import type { FormattingButton } from '../../../../../app/ui-message/client/messageBox/messageBoxFormatting';
import type { ComposerAPI } from '../../../../lib/chats/ChatAPI';

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
		// Prevent Ctrl+B from creating <b></b> and Ctrl+I from creating <i></i>
		event.preventDefault();
	}

	composer.wrapSelection(formatter.pattern);
	return true;
};

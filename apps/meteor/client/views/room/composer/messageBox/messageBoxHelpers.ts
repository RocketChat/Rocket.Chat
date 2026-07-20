
import type { ClipboardEvent } from 'react';

import type { FormattingButton } from '../../../../../app/ui-message/client/messageBox/messageBoxFormatting';
import { getImageExtensionFromMime } from '../../../../../lib/getImageExtensionFromMime';
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
	const isMacOS = navigator.platform.indexOf('Mac') !== -1;
	const isCmdOrCtrlPressed = (isMacOS && event.metaKey) || (!isMacOS && event.ctrlKey);

	if (!isCmdOrCtrlPressed) {
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

export const extractImageFilesFromClipboard = (event: ClipboardEvent<HTMLElement>, format: (date: Date) => string): File[] => {
	const { clipboardData } = event;

	if (!clipboardData) {
		return [];
	}

	const items = Array.from(clipboardData.items);

	if (items.some(({ kind, type }) => kind === 'string' && type === 'text/plain')) {
		return [];
	}

	return items
		.filter((item) => item.kind === 'file' && item.type.indexOf('image/') !== -1)
		.map((item) => {
			const fileItem = item.getAsFile();

			if (!fileItem) {
				return;
			}

			const imageExtension = fileItem ? getImageExtensionFromMime(fileItem.type) : undefined;

			const extension = imageExtension ? `.${imageExtension}` : '';

			Object.defineProperty(fileItem, 'name', {
				writable: true,
				value: `Clipboard - ${format(new Date())}${extension}`,
			});
			return fileItem;
		})
		.filter((file): file is File => !!file);
};

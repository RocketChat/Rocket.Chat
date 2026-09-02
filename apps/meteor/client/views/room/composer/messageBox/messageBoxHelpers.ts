import { sanitizeUrl } from '@rocket.chat/gazzodown-alt';
import type { ClipboardEvent, MouseEvent } from 'react';

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

export const getClickedLink = (event: MouseEvent<HTMLElement>): HTMLAnchorElement | null => (event.target as HTMLElement).closest('a');

// A contenteditable swallows link navigation, so Cmd/Ctrl+click has to be resolved by hand.
export const getModifierClickHref = (event: MouseEvent<HTMLElement>): string | undefined => {
	if (!isCmdOrCtrlPressed(event)) {
		return undefined;
	}

	const href = getClickedLink(event)?.getAttribute('href');

	if (!href || !sanitizeUrl(href)) {
		return undefined;
	}

	return href;
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

// The composer renders its own markup from plain text, so a paste carrying HTML must never reach the
// contenteditable: the browser would insert that markup verbatim.
export const extractPastedPlainText = (event: ClipboardEvent<HTMLElement>): string | undefined => {
	const { clipboardData } = event;

	if (!clipboardData || !Array.from(clipboardData.types).includes('text/html')) {
		return undefined;
	}

	return clipboardData.getData('text/plain');
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

import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { KeyboardEvent } from 'react';
import { useState } from 'react';

import { AnimatedVisibility } from '../AnimatedVisibility';
import type { OptionType } from './OptionType';
import type { VisibilityHandler } from './useVisible';
import { useVisible } from './useVisible';

const keyCodes = {
	ESC: 27,
	KEY_UP: 38,
	KEY_DOWN: 40,
	HOME: 36,
	END: 35,
	TAB: 9,
	ENTER: 13,
};

const findLastIndex = <T>(options: T[], predicate: (value: T, index: number, obj: T[]) => unknown) => {
	for (let i = options.length - 1; i >= 0; i--) {
		if (predicate(options[i], i, options)) {
			return i;
		}
	}

	return -1;
};

const findPreviousIndex = <T>(options: T[], predicate: (value: T, index: number, obj: T[]) => unknown, currentIndex: number) => {
	for (let i = currentIndex - 1; i >= 0; i--) {
		if (predicate(options[i], i, options)) {
			return i;
		}
	}

	return -1;
};

const findNextIndex = <T>(options: T[], predicate: (value: T, index: number, obj: T[]) => unknown, currentIndex: number) => {
	for (let i = currentIndex + 1; i < options.length; i++) {
		if (predicate(options[i], i, options)) {
			return i;
		}
	}

	return -1;
};

export const useCursor = <
	T extends readonly [value: unknown, label: unknown, selected?: unknown, disabled?: unknown, type?: OptionType[4], url?: string] =
		OptionType,
>(
	initial: number,
	options: Array<T>,
	onChange: (option: T, visibilityHandler: VisibilityHandler) => void,
): [
	cursor: number,
	handleKeyDown: (e: KeyboardEvent) => void,
	handleKeyUp: (e: KeyboardEvent) => void,
	reset: () => void,
	visibilityHandler: VisibilityHandler,
] => {
	const [cursor, setCursor] = useState(initial);
	const visibilityHandler = useVisible();
	const [visibility, hide, show] = visibilityHandler;
	const reset = useStableCallback(() => setCursor(0));
	const handleKeyUp = useStableCallback((e: KeyboardEvent) => {
		const { keyCode } = e;
		if (AnimatedVisibility.HIDDEN === visibility && keyCode === keyCodes.TAB) {
			return show();
		}
	});

	const handleKeyDown = useStableCallback((e: KeyboardEvent) => {
		const isSelectableOption = ([, , , type]: T) => !type || type === 'option';
		const getLastIndex = () => findLastIndex(options, isSelectableOption);

		const { keyCode, key } = e;
		if (AnimatedVisibility.HIDDEN === visibility && keyCode !== keyCodes.ESC && keyCode !== keyCodes.TAB) {
			show();
		}
		switch (keyCode) {
			case keyCodes.HOME:
				e.preventDefault();
				return reset();

			case keyCodes.END:
				e.preventDefault();
				return setCursor(getLastIndex());

			case keyCodes.KEY_UP:
				e.preventDefault();
				if (cursor < 1) {
					return setCursor(getLastIndex());
				}
				return setCursor((cursor) => findPreviousIndex(options, isSelectableOption, cursor));

			case keyCodes.KEY_DOWN:
				e.preventDefault();
				if (cursor === getLastIndex()) {
					return setCursor(0);
				}
				return setCursor((cursor) => findNextIndex(options, isSelectableOption, cursor));

			case keyCodes.ENTER:
				e.preventDefault();
				if (visibility === AnimatedVisibility.VISIBLE) {
					e.persist();
					e.nativeEvent.stopImmediatePropagation(); // TODO
					e.stopPropagation();
				}
				hide();
				onChange(options[cursor], visibilityHandler);
				return;

			case keyCodes.ESC:
				e.preventDefault();
				reset();
				hide();
				if (visibility === AnimatedVisibility.VISIBLE) {
					e.persist();
					e.nativeEvent.stopImmediatePropagation(); // TODO
					e.stopPropagation();
					return false;
				}
				break;

			default:
				if (key.match(/^[\d\w]$/i)) {
					const index = options.findIndex((option) => {
						if (!isSelectableOption(option)) {
							return false;
						}

						const [, label] = option;
						return typeof label === 'string' && label[0].toLowerCase() === key;
					});
					if (~index) setCursor(index);
				}
		}
	});

	return [cursor, handleKeyDown, handleKeyUp, reset, visibilityHandler];
};

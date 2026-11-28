import { useActiveDescendant, useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { UseQueryResult } from '@tanstack/react-query';
import type { MutableRefObject, RefCallback } from 'react';
import { useEffect, useCallback, useId, useState, useRef } from 'react';

import { useComposerBoxPopupQueries } from './useComposerBoxPopupQueries';
import { useChat } from '../../contexts/ChatContext';
import type { ComposerPopupOption } from '../../contexts/ComposerPopupContext';

type ComposerBoxPopupImperativeCommands<T> = MutableRefObject<
	| {
			getFilter?: () => string;
			select?: (s: T) => void;
	  }
	| undefined
>;

type ComposerBoxPopupOptions<T extends { _id: string; sort?: number | undefined }> = ComposerPopupOption<T>;

type ComposerBoxPopupResult<T extends { _id: string; sort?: number }> =
	| {
			option: ComposerPopupOption<T>;
			items: UseQueryResult<T[]>[];
			focused: T | undefined;
			focusVisible: boolean;
			listboxId: string;
			select: (item: T) => void;
			hover: (item: T) => void;
			callbackRef: RefCallback<HTMLElement>;
			commandsRef: ComposerBoxPopupImperativeCommands<T>;
			suspended: boolean;
			filter: unknown;
			clear: () => void;
	  }
	| {
			option: undefined;
			items: undefined;
			focused: undefined;
			focusVisible: false;
			listboxId: string;
			callbackRef: RefCallback<HTMLElement>;
			select: undefined;
			hover: undefined;
			commandsRef: ComposerBoxPopupImperativeCommands<T>;
			suspended: undefined;
			filter: unknown;
			clear: () => void;
	  };

const keys = {
	TAB: 9,
	ENTER: 13,
	ESC: 27,
	ARROW_UP: 38,
	ARROW_DOWN: 40,
} as const;

export const useComposerBoxPopup = <T extends { _id: string; sort?: number }>(
	options: ComposerBoxPopupOptions<T>[],
): ComposerBoxPopupResult<T> => {
	const [optionIndex, setOptionIndex] = useState<number>(-1);
	const { active: focused, setActive: setFocused, focusVisible, setFocusVisible, moveByKeyboard, moveByPointer } = useActiveDescendant<T>();
	const listboxId = useId();
	const [filter, setFilter] = useState('');

	const option = options[optionIndex];

	const commandsRef: ComposerBoxPopupImperativeCommands<T> = useRef(undefined);

	const { queries: items, suspended } = useComposerBoxPopupQueries(filter, option) as {
		queries: UseQueryResult<T[]>[];
		suspended: boolean;
	};

	const chat = useChat();

	useEffect(() => {
		if (!option) {
			return;
		}

		if (option?.preview && suspended) {
			setFocused(undefined);
			return;
		}
		setFocused((focused) => {
			const sortedItems = items
				.filter((item) => item.isSuccess)
				.flatMap((item) => item.data)
				.sort((a, b) => (('sort' in a && a.sort) || 0) - (('sort' in b && b.sort) || 0));
			return sortedItems.find((item) => item._id === focused?._id) ?? sortedItems[0];
		});
	}, [items, option, suspended, setFocused]);

	const select = useStableCallback((item: T) => {
		if (!option) {
			throw new Error('No popup is open');
		}

		if (commandsRef.current?.select) {
			commandsRef.current.select(item);
		} else {
			const value = chat?.composer?.substring(0, chat?.composer?.selection.start);
			const selector =
				option.matchSelectorRegex ??
				(option.triggerAnywhere ? new RegExp(`(?:^|\\s)(${option.trigger})([^\\s]*$)`) : new RegExp(`(?:^)(${option.trigger})([^\\s]*$)`));

			const result = value?.match(selector);
			if (!result || !value) {
				return;
			}

			chat?.composer?.replaceText((option.prefix ?? option.trigger ?? '') + option.getValue(item) + (option.suffix ?? ''), {
				start: value.lastIndexOf(result[1] + result[2]),
				end: chat?.composer?.selection.start,
			});
		}
		setOptionIndex(-1);
		setFocused(undefined);
	});

	const setOptionByInput = useStableCallback((): ComposerBoxPopupOptions<T> | undefined => {
		const value = chat?.composer?.substring(0, chat?.composer?.selection.start);

		if (!value) {
			setOptionIndex(-1);
			setFocused(undefined);
			return;
		}

		const optionIndex = options.findIndex(({ trigger, matchSelectorRegex, triggerAnywhere, triggerLength }) => {
			const selector =
				matchSelectorRegex ?? (triggerAnywhere ? new RegExp(`(?:^|\\s)(${trigger})[^\\s]*$`) : new RegExp(`(?:^)(${trigger})[^\\s]*$`));
			const result = selector.test(value);
			if (!triggerLength || !result) {
				return result;
			}
			const filter = value.match(selector);
			return filter && triggerLength < filter[0].length;
		});
		setOptionIndex(optionIndex);
		const option = options[optionIndex];
		if (!option) {
			setFocused(undefined);
			setFilter('');
		}

		if (option) {
			const selector =
				option.matchSelectorRegex ??
				(option.triggerAnywhere ? new RegExp(`(?:^|\\s)(${option.trigger})([^\\s]*$)`) : new RegExp(`(?:^)(${option.trigger})([^\\s]*$)`));
			const result = value.match(selector);
			setFilter(commandsRef.current?.getFilter?.() ?? (result ? result[2] : ''));
		}
		return option;
	});

	const handleFocus = useStableCallback((event: FocusEvent) => {
		if (option) {
			return;
		}
		setFocusVisible(event.target instanceof Element && event.target.matches(':focus-visible'));
		setOptionByInput();
	});

	const handleInput = useStableCallback(() => {
		setFocusVisible(true);
		setOptionByInput();
	});

	const handleKeyUp = useStableCallback((event: KeyboardEvent) => {
		if (event.which === keys.ESC) {
			if (option?.closeOnEsc === true) {
				setOptionIndex(-1);
				setFocused(undefined);
				event.preventDefault();
				event.stopImmediatePropagation();
			}
			return;
		}

		setOptionByInput();
	});

	const handleKeyDown = useStableCallback((event: KeyboardEvent) => {
		if (!option) {
			return;
		}

		if (event.which === keys.ENTER || event.which === keys.TAB) {
			if (!focused) {
				return;
			}

			if ('disabled' in focused && focused.disabled) {
				if (event.which === keys.ENTER) {
					event.preventDefault();
					event.stopImmediatePropagation();
					return true;
				}
				return;
			}

			select(focused);

			event.preventDefault();
			event.stopImmediatePropagation();
			return true;
		}
		if (event.which === keys.ARROW_UP && !(event.shiftKey || event.ctrlKey || event.altKey || event.metaKey)) {
			moveByKeyboard((focused) => {
				const list = items
					.filter((item) => item.isSuccess)
					.flatMap((item) => item.data)
					.sort((a, b) => (('sort' in a && a.sort) || 0) - (('sort' in b && b.sort) || 0));

				if (!list) {
					return;
				}

				const focusedIndex = list.findIndex((item) => item === focused);

				return focusedIndex > 0 ? list[focusedIndex - 1] : list[list.length - 1];
			});
			event.preventDefault();
			event.stopImmediatePropagation();
			return true;
		}
		if (event.which === keys.ARROW_DOWN && !(event.shiftKey || event.ctrlKey || event.altKey || event.metaKey)) {
			moveByKeyboard((focused) => {
				const list = items
					.filter((item) => item.isSuccess)
					.flatMap((item) => item.data)
					.sort((a, b) => (('sort' in a && a.sort) || 0) - (('sort' in b && b.sort) || 0));

				if (!list) {
					return undefined;
				}

				const focusedIndex = list.findIndex((item) => item === focused);

				return focusedIndex < list.length - 1 ? list[focusedIndex + 1] : list[0];
			});
			event.preventDefault();
			event.stopImmediatePropagation();
			return true;
		}
	});

	const clear = useStableCallback(() => {
		setOptionIndex(-1);
		setFocused(undefined);
		setFilter('');
	});

	const callbackRef = useCallback(
		(node: HTMLElement) => {
			node.addEventListener('input', handleInput);
			node.addEventListener('keyup', handleKeyUp);
			node.addEventListener('keydown', handleKeyDown);
			node.addEventListener('focus', handleFocus);

			return () => {
				node.removeEventListener('input', handleInput);
				node.removeEventListener('keyup', handleKeyUp);
				node.removeEventListener('keydown', handleKeyDown);
				node.removeEventListener('focus', handleFocus);
			};
		},
		[handleInput, handleKeyUp, handleKeyDown, handleFocus],
	);

	if (!option) {
		return {
			option: undefined,
			items: undefined,
			focused: undefined,
			focusVisible: false,
			listboxId,
			select: undefined,
			hover: undefined,
			callbackRef,
			commandsRef,
			suspended: undefined,
			filter: undefined,
			clear,
		};
	}

	return {
		option,
		items,
		focused,
		focusVisible,
		listboxId,
		select,
		hover: moveByPointer,
		callbackRef,
		commandsRef,
		suspended,
		filter,
		clear,
	};
};

/**
 * The listbox the message field controls while a composer popup shows one.
 */
export const getComposerPopupListboxId = (
	popup: Pick<ReturnType<typeof useComposerBoxPopup>, 'option' | 'suspended' | 'listboxId'>,
	showsList?: boolean,
) => {
	if (popup.option?.preview && !popup.suspended) {
		return `${popup.listboxId}-preview`;
	}

	if (popup.option && showsList) {
		return popup.listboxId;
	}

	return undefined;
};

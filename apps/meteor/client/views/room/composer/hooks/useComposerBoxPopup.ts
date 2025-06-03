import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { UseQueryResult } from '@tanstack/react-query';
import type { MutableRefObject } from 'react';
import { useEffect, useCallback, useState, useRef } from 'react';

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
			select: (item: T) => void;
			callbackRef: (node: HTMLElement) => void;
			commandsRef: ComposerBoxPopupImperativeCommands<T>;
			suspended: boolean;
			filter: unknown;
			clear: () => void;
	  }
	| {
			option: undefined;
			items: undefined;
			focused: undefined;
			callbackRef: (node: HTMLElement) => void;
			select: undefined;
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
	const [focused, setFocused] = useState<T | undefined>(undefined);
	const [filter, setFilter] = useState('');

	const option = options[optionIndex];

	const commandsRef: ComposerBoxPopupImperativeCommands<T> = useRef();

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
				.flatMap((item) => item.data as T[])
				.sort((a, b) => (('sort' in a && a.sort) || 0) - (('sort' in b && b.sort) || 0));
			return sortedItems.find((item) => item._id === focused?._id) ?? sortedItems[0];
		});
	}, [items, option, suspended]);

	const select = useEffectEvent((item: T) => {
		if (!option) {
			throw new Error('No popup is open');
		}

		if (commandsRef.current?.select) {
			commandsRef.current.select(item);
		} else {
			const value = chat?.composer?.substring(0, chat?.composer?.selection.start);
			const selector =
				option.matchSelectorRegex ??
				(option.triggerAnywhere ? new RegExp(`(?:^| |\n)(${option.trigger})([^\\s]*$)`) : new RegExp(`(?:^)(${option.trigger})([^\\s]*$)`));

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

	const setOptionByInput = useEffectEvent((): ComposerBoxPopupOptions<T> | undefined => {
		const value = chat?.composer?.substring(0, chat?.composer?.selection.start);

		if (!value) {
			setOptionIndex(-1);
			setFocused(undefined);
			return;
		}

		const optionIndex = options.findIndex(({ trigger, matchSelectorRegex, triggerAnywhere, triggerLength }) => {
			const selector =
				matchSelectorRegex ?? (triggerAnywhere ? new RegExp(`(?:^| |\n)(${trigger})[^\\s]*$`) : new RegExp(`(?:^)(${trigger})[^\\s]*$`));
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
				(option.triggerAnywhere ? new RegExp(`(?:^| |\n)(${option.trigger})([^\\s]*$)`) : new RegExp(`(?:^)(${option.trigger})([^\\s]*$)`));
			const result = value.match(selector);
			setFilter(commandsRef.current?.getFilter?.() ?? (result ? result[2] : ''));
		}
		return option;
	});

	const handleFocus = useEffectEvent(() => {
		if (option) {
			return;
		}
		setOptionByInput();
	});

	const handleKeyUp = useEffectEvent((event: KeyboardEvent) => {
		if (!setOptionByInput()) {
			return;
		}

		if (!option) {
			return;
		}

		if (option.closeOnEsc === true && event.which === keys.ESC) {
			setOptionIndex(-1);
			setFocused(undefined);
			event.preventDefault();
			event.stopImmediatePropagation();
		}
	});

	const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
		if (!option) {
			return;
		}

		if (event.which === keys.ENTER || event.which === keys.TAB) {
			if (!focused) {
				return;
			}

			select(focused);

			event.preventDefault();
			event.stopImmediatePropagation();
			return true;
		}
		if (event.which === keys.ARROW_UP && !(event.shiftKey || event.ctrlKey || event.altKey || event.metaKey)) {
			setFocused((focused) => {
				const list = items
					.filter((item) => item.isSuccess)
					.flatMap((item) => item.data as T[])
					.sort((a, b) => (('sort' in a && a.sort) || 0) - (('sort' in b && b.sort) || 0));

				if (!list) {
					return;
				}

				const focusedIndex = list.findIndex((item) => item === focused);

				return (focusedIndex > 0 ? list[focusedIndex - 1] : list[list.length - 1]) as T;
			});
			event.preventDefault();
			event.stopImmediatePropagation();
			return true;
		}
		if (event.which === keys.ARROW_DOWN && !(event.shiftKey || event.ctrlKey || event.altKey || event.metaKey)) {
			setFocused((focused) => {
				const list = items
					.filter((item) => item.isSuccess)
					.flatMap((item) => item.data as T[])
					.sort((a, b) => (('sort' in a && a.sort) || 0) - (('sort' in b && b.sort) || 0));

				if (!list) {
					return undefined;
				}

				const focusedIndex = list.findIndex((item) => item === focused);

				return (focusedIndex < list.length - 1 ? list[focusedIndex + 1] : list[0]) as T;
			});
			event.preventDefault();
			event.stopImmediatePropagation();
			return true;
		}
	});

	const clear = useEffectEvent(() => {
		if (!option) {
			return;
		}

		setOptionIndex(-1);
		setFocused(undefined);
		setFilter('');
	});

	const ref = useRef<HTMLElement | null>(null);
	const callbackRef = useCallback(
		(node: HTMLElement | null) => {
			if (ref.current) {
				ref.current.removeEventListener('keyup', handleKeyUp);
				ref.current.removeEventListener('keydown', handleKeyDown);
				ref.current.removeEventListener('focus', handleFocus);
				ref.current = null;
			}

			if (node) {
				ref.current = node;
				node.addEventListener('keyup', handleKeyUp);
				node.addEventListener('keydown', handleKeyDown);
				node.addEventListener('focus', handleFocus);
			}
		},
		[handleKeyUp, handleKeyDown, handleFocus],
	);

	if (!option) {
		return {
			option: undefined,
			items: undefined,
			focused: undefined,
			select: undefined,
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
		select,
		callbackRef,
		commandsRef,
		suspended,
		filter,
		clear,
	};
};

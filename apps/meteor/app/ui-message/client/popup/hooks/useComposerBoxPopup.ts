import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import type { UseQueryResult } from '@tanstack/react-query';
import type { MutableRefObject } from 'react';
import { useEffect, useCallback, useState, useRef } from 'react';

import { useChat } from '../../../../../client/views/room/contexts/ChatContext';
import type { ComposerPopupOption } from '../../../../../client/views/room/contexts/ComposerPopupContext';
import { useComposerBoxPopupQueries } from './useComposerBoxPopupQueries';

type ComposerBoxPopupImperativeCommands<T> = MutableRefObject<
	| {
			getFilter?: () => unknown;
			select?: (s: T) => void;
	  }
	| undefined
>;

type ComposerBoxPopupOptions<T extends { _id: string; sort?: number | undefined }> = ComposerPopupOption<T>;

type ComposerBoxPopupResult<T extends { _id: string; sort?: number }> =
	| {
			popup: ComposerPopupOption<T>;
			items: UseQueryResult<T[]>[];
			focused: T | undefined;
			ariaActiveDescendant: string | undefined;
			select: (item: T) => void;
			callbackRef: (node: HTMLElement) => void;
			commandsRef: ComposerBoxPopupImperativeCommands<T>;
			suspended: boolean;
			filter: unknown;
			clearPopup: () => void;
	  }
	| {
			popup: undefined;
			items: undefined;
			focused: undefined;
			ariaActiveDescendant: undefined;
			callbackRef: (node: HTMLElement) => void;
			select: undefined;
			commandsRef: ComposerBoxPopupImperativeCommands<T>;
			suspended: boolean;
			filter: unknown;
			clearPopup: () => void;
	  };

const keys = {
	TAB: 9,
	ENTER: 13,
	ESC: 27,
	ARROW_LEFT: 37,
	ARROW_UP: 38,
	ARROW_RIGHT: 39,
	ARROW_DOWN: 40,
};

export const useComposerBoxPopup = <T extends { _id: string; sort?: number }>({
	configurations,
}: {
	configurations: ComposerBoxPopupOptions<T>[];
}): ComposerBoxPopupResult<T> => {
	const [popup, setPopup] = useState<ComposerBoxPopupOptions<T> | undefined>(undefined);
	const [focused, setFocused] = useState<T | undefined>(undefined);
	const [filter, setFilter] = useState<unknown>('');

	const commandsRef: ComposerBoxPopupImperativeCommands<T> = useRef();

	const { queries: items, suspended } = useComposerBoxPopupQueries(filter, popup) as {
		queries: UseQueryResult<T[]>[];
		suspended: boolean;
	};

	const chat = useChat();

	const ariaActiveDescendant = focused ? `popup-item-${focused._id}` : undefined;

	useEffect(() => {
		if (!popup) {
			return;
		}

		if (popup?.preview && suspended) {
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
	}, [items, popup, suspended]);

	const select = useMutableCallback((item: T) => {
		if (!popup) {
			throw new Error('No popup is open');
		}

		if (commandsRef.current?.select) {
			commandsRef.current.select(item);
		} else {
			const value = chat?.composer?.substring(0, chat?.composer?.selection.start);
			const selector =
				popup.matchSelectorRegex ??
				(popup.triggerAnywhere ? new RegExp(`(?:^| |\n)(${popup.trigger})([^\\s]*$)`) : new RegExp(`(?:^)(${popup.trigger})([^\\s]*$)`));

			const result = value?.match(selector);
			if (!result || !value) {
				return;
			}

			chat?.composer?.replaceText((popup.prefix ?? popup.trigger ?? '') + popup.getValue(item) + (popup.suffix ?? ''), {
				start: value.lastIndexOf(result[1] + result[2]),
				end: chat?.composer?.selection.start,
			});
		}
		setPopup(undefined);
		setFocused(undefined);
	});

	const setConfigByInput = useMutableCallback((): ComposerBoxPopupOptions<T> | undefined => {
		const value = chat?.composer?.substring(0, chat?.composer?.selection.start);

		if (!value) {
			setPopup(undefined);
			setFocused(undefined);
			return;
		}

		const configuration = configurations.find(({ trigger, matchSelectorRegex, triggerAnywhere, triggerLength }) => {
			const selector =
				matchSelectorRegex ?? (triggerAnywhere ? new RegExp(`(?:^| |\n)(${trigger})[^\\s]*$`) : new RegExp(`(?:^)(${trigger})[^\\s]*$`));
			const result = selector.test(value);
			if (!triggerLength || !result) {
				return result;
			}
			const filter = value.match(selector);
			return filter && triggerLength < filter[0].length;
		});
		setPopup(configuration);
		if (!configuration) {
			setFocused(undefined);
			setFilter('');
		}

		if (configuration) {
			const selector =
				configuration.matchSelectorRegex ??
				(configuration.triggerAnywhere
					? new RegExp(`(?:^| |\n)(${configuration.trigger})([^\\s]*$)`)
					: new RegExp(`(?:^)(${configuration.trigger})([^\\s]*$)`));
			const result = value.match(selector);
			setFilter(commandsRef.current?.getFilter?.() ?? (result ? result[2] : ''));
		}
		return configuration;
	});

	const onFocus = useMutableCallback(() => {
		if (popup) {
			return;
		}
		setConfigByInput();
	});

	const keyup = useMutableCallback((event: KeyboardEvent) => {
		if (!setConfigByInput()) {
			return;
		}

		if (!popup) {
			return;
		}

		if (popup.closeOnEsc === true && event.which === keys.ESC) {
			setPopup(undefined);
			setFocused(undefined);
			event.preventDefault();
			event.stopPropagation();
		}
	});

	const keydown = useMutableCallback((event: KeyboardEvent) => {
		if (!popup) {
			return;
		}

		if (event.which === keys.ENTER || event.which === keys.TAB) {
			if (!focused) {
				return;
			}

			select(focused);

			event.preventDefault();
			event.stopPropagation();
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
			event.stopPropagation();
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
			event.stopPropagation();
			return true;
		}
	});

	const clearPopup = useMutableCallback(() => {
		if (!popup) {
			return;
		}

		setPopup(undefined);
		setFocused(undefined);
		setFilter('');
	});

	const callbackRef = useCallback(
		(node: HTMLElement | null) => {
			if (!node) {
				return;
			}

			node.addEventListener('keyup', keyup);
			node.addEventListener('keydown', keydown);
			node.addEventListener('focus', onFocus);
		},
		[keyup, keydown, onFocus],
	);

	if (!popup) {
		return {
			callbackRef,
			focused: undefined,
			items: undefined,
			ariaActiveDescendant: undefined,
			popup: undefined,
			select: undefined,
			suspended: true,
			commandsRef,
			filter: undefined,
			clearPopup,
		};
	}

	return {
		focused,
		items,
		ariaActiveDescendant,
		popup,
		select,
		filter,
		suspended,
		commandsRef,
		callbackRef,
		clearPopup,
	};
};

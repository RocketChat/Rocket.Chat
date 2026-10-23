import type { OverlayTriggerState } from '@react-stately/overlays';
import { useActiveDescendant, useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { KeyboardEvent } from 'react';
import { createContext, useContext, useEffect, useMemo, useRef } from 'react';

import { getActiveDescendantOptionProps } from '../../../hooks/getActiveDescendantOptionProps';

type SearchActiveOptionContextValue = {
	activeId: string | undefined;
	focusVisible: boolean;
	activate: (id: string) => void;
	syncWithOptions: () => void;
};

export const SearchActiveOptionContext = createContext<SearchActiveOptionContextValue>({
	activeId: undefined,
	focusVisible: false,
	activate: () => undefined,
	syncWithOptions: () => undefined,
});

/**
 * Keeps DOM focus on the search combobox and points it at the active option: no option is active until an arrow key
 * picks one, typing clears it, and it never points at an option the list no longer renders.
 */
export const useSearchActiveOption = (state: OverlayTriggerState, listboxId: string | undefined) => {
	const { active: activeId, setActive, focusVisible, setFocusVisible, moveByKeyboard, moveByPointer } = useActiveDescendant<string>();
	const pendingStep = useRef<1 | -1 | undefined>(undefined);

	useEffect(() => {
		if (!state.isOpen) {
			setActive(undefined);
			pendingStep.current = undefined;
		}
	}, [state.isOpen, setActive]);

	const getOptions = () => Array.from(document.getElementById(listboxId ?? '')?.querySelectorAll<HTMLElement>('[role="option"][id]') ?? []);

	const move = (step: 1 | -1) => {
		const options = getOptions();
		if (!options.length) {
			return;
		}

		const index = options.findIndex((option) => option.id === activeId);
		const start = step === 1 ? -1 : options.length;
		const next = options[((index === -1 ? start : index) + step + options.length) % options.length];

		next.scrollIntoView({ block: 'nearest' });
		moveByKeyboard(next.id);
	};

	const handleKeyDown = useStableCallback((event: KeyboardEvent) => {
		const wasOpen = state.isOpen;
		state.setOpen(true);

		if (event.code === 'Tab' || event.key === 'Escape') {
			state.close();
			return;
		}

		if (event.code === 'ArrowDown' || event.code === 'ArrowUp') {
			event.preventDefault();
			const step = event.code === 'ArrowDown' ? 1 : -1;
			if (wasOpen) {
				move(step);
			} else {
				pendingStep.current = step;
			}
			return;
		}

		if (event.key === 'Enter' && activeId) {
			const option = document.getElementById(activeId);
			if (option) {
				event.preventDefault();
				option.click();
			}
		}
	});

	const handleInput = useStableCallback(() => {
		setActive(undefined);
		setFocusVisible(true);
	});

	const syncWithOptions = useStableCallback(() => {
		if (pendingStep.current && getOptions().length) {
			const step = pendingStep.current;
			pendingStep.current = undefined;
			move(step);
			return;
		}

		if (activeId && !document.getElementById(activeId)) {
			setActive(undefined);
		}
	});

	const contextValue = useMemo(
		() => ({ activeId, focusVisible, activate: moveByPointer, syncWithOptions }),
		[activeId, focusVisible, moveByPointer, syncWithOptions],
	);

	return {
		activeId: state.isOpen ? activeId : undefined,
		handleKeyDown,
		handleInput,
		contextValue,
	};
};

/**
 * Props that render a search option as the active one when the combobox points at it.
 */
export const useSearchOptionProps = (id: string | undefined) => {
	const { activeId, focusVisible, activate } = useContext(SearchActiveOptionContext);

	return {
		id,
		...getActiveDescendantOptionProps(!!id && id === activeId, focusVisible, () => id && activate(id)),
	};
};

/**
 * Lets the search combobox reconcile its active option whenever the rendered results change.
 */
export const useSyncSearchOptions = (results: unknown) => {
	const { syncWithOptions } = useContext(SearchActiveOptionContext);

	useEffect(() => {
		syncWithOptions();
	}, [syncWithOptions, results]);
};

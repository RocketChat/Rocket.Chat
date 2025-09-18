/* eslint-disable react-hooks/exhaustive-deps */
import { useSafeRefCallback } from '@rocket.chat/ui-client';
import type { DependencyList, RefCallback } from 'react';
import { useCallback } from 'react';
import tinykeys from 'tinykeys';

/**
 * A hook to enable form submission via keyboard shortcut ($mod+Enter).
 *
 * @param callback - The function to execute when the keyboard shortcut is pressed.
 * @param deps - The dependency array for the callback memoization.
 * @returns A ref callback to be attached to the form element.
 */
export const useFormKeyboardSubmit = (callback: (event: KeyboardEvent) => void, deps: DependencyList): RefCallback<HTMLFormElement> => {
	return useSafeRefCallback(
		useCallback((formRef: HTMLFormElement | null) => {
			if (!formRef) {
				return;
			}

			return tinykeys(formRef, { '$mod+Enter': callback });
		}, deps),
	);
};

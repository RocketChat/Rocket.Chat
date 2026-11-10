import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useRef } from 'react';

const findMatch = (labels: readonly string[], query: string, start: number) => {
	for (let offset = 0; offset < labels.length; offset++) {
		const index = (start + offset) % labels.length;

		if (labels[index]?.toLocaleLowerCase().startsWith(query)) {
			return index;
		}
	}

	return -1;
};

/**
 * Hook that finds the option a user means by typing the start of its label.
 *
 * Characters typed within `timeout` of each other build up one query; typing the same character again
 * cycles through the options that start with it.
 *
 * @param timeout - the pause, in milliseconds, after which typing starts a new query
 * @returns `search`, a stable function that takes the typed character, the option labels and the index of the current option,
 * and returns the index of the matching option, or -1; `isSearching`, which tells whether a query is still being typed,
 * so a space can extend it instead of acting on the option; and `reset`, which drops the query once the interaction ends
 */
export const useTypeahead = (timeout = 500) => {
	const queryRef = useRef('');
	const lastTypedAtRef = useRef(0);

	const isSearching = useStableCallback(() => queryRef.current !== '' && Date.now() - lastTypedAtRef.current <= timeout);

	const search = useStableCallback((character: string, labels: readonly string[], current: number): number => {
		const now = Date.now();

		if (now - lastTypedAtRef.current > timeout) {
			queryRef.current = '';
		}

		lastTypedAtRef.current = now;
		queryRef.current += character.toLocaleLowerCase();

		const query = queryRef.current;
		const isRepeatedCharacter = [...query].every((typed) => typed === query[0]);

		if (query.length > 1 && !isRepeatedCharacter) {
			return findMatch(labels, query, Math.max(current, 0));
		}

		return findMatch(labels, query[0] ?? '', current + 1);
	});

	const reset = useStableCallback(() => {
		queryRef.current = '';
	});

	return { search, isSearching, reset };
};

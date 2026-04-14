import { useEffect } from 'react';

export const FIELD_ANCHORS = {
	clockMode: 'clockMode',
	hideUsernames: 'hideUsernames',
	hideRoles: 'hideRoles',
} as const;

const availableHashes: Set<string> = new Set(Object.values(FIELD_ANCHORS));

export const useScrollToHash = () => {
	const hash = window.location.hash.slice(1);
	const shouldExpand = availableHashes.has(hash);

	useEffect(() => {
		if (!hash) {
			return;
		}

		requestAnimationFrame(() => {
			document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		});
	}, [hash]);

	return { shouldExpand };
};

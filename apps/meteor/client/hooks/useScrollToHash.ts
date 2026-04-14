import { useEffect } from 'react';

export const fieldAnchors = {
	clockMode: 'clockMode',
	hideUsernames: 'hideUsernames',
	hideRoles: 'hideRoles',
} as const;

const availableHashes = new Set(Object.values(fieldAnchors));

export const useScrollToHash = () => {
	const hash = window.location.hash.slice(1);
	const shouldExpand = availableHashes.has(hash as keyof typeof fieldAnchors);

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

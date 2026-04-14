import { useLocationHash } from '@rocket.chat/ui-contexts';

import { availableHashes } from './useRouterScrollToHash';

export { TARGET_ANCHORS } from './useRouterScrollToHash';

/**
 * Returns whether the current URL hash matches a known target anchor.
 * Useful for auto-expanding sections that contain the target element.
 *
 * @see docs/anchor-navigation.md
 */
export const useHasValidLocationHash = () => {
	const hash = useLocationHash();
	const id = hash.slice(1);
	return availableHashes.has(id);
};

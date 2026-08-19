import { useGroupsToggle } from './useGroupsToggle';

/**
 * Controls the "Show unreads" behavior of the system/standard sidebar groups (Teams, Channels, …).
 * Custom categories keep this flag on their own preference object instead.
 *
 * Defaults to OFF for every group: localStorage stores only the group keys whose toggle has been turned ON.
 */
export const useShowUnreadsGroups = () => {
	const { isEnabled: isShowUnreads, toggle: toggleShowUnreads } = useGroupsToggle('sidebarShownUnreadGroups');
	return { isShowUnreads, toggleShowUnreads };
};

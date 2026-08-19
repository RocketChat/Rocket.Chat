import { useGroupsToggle } from './useGroupsToggle';

/**
 * Controls the "Keep unreads on top" behavior of the system/standard sidebar groups (Teams, Channels, …).
 * Custom categories keep this flag on their own preference object instead.
 *
 * Defaults to OFF: localStorage only stores the group keys whose toggle has been turned ON.
 */
export const useKeepUnreadsOnTopGroups = () => {
	const { isEnabled: isKeepUnreadsOnTop, toggle: toggleKeepUnreadsOnTop } = useGroupsToggle('sidebarKeepUnreadsOnTopGroups');
	return { isKeepUnreadsOnTop, toggleKeepUnreadsOnTop };
};

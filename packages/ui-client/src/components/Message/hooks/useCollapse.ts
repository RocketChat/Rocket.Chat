import { useToggle } from '@rocket.chat/fuselage-hooks';
import { useAttachmentIsCollapsedByDefault } from '@rocket.chat/ui-contexts';

import { useMessageRelatedData } from '../contexts/MessageRelatedDataContext';

/**
 * Whether a collapsible part of a message is collapsed, and how to toggle it. With a `key`, the state is remembered across
 * mounts by the provider, so it survives the row being recycled on scroll; without one it is local to the component.
 */
export const useCollapse = (attachmentCollapsed?: boolean, key?: string) => {
	const collapseByDefault = useAttachmentIsCollapsedByDefault();
	const defaultCollapsed = !!(collapseByDefault || attachmentCollapsed);

	const [persistedCollapsed, togglePersistedCollapsed] = useMessageRelatedData().useCollapsedState(key ?? '', defaultCollapsed);
	const [localCollapsed, toggleLocalCollapsed] = useToggle(defaultCollapsed);

	if (key) {
		return [persistedCollapsed, togglePersistedCollapsed] as const;
	}

	return [localCollapsed, () => toggleLocalCollapsed()] as const;
};

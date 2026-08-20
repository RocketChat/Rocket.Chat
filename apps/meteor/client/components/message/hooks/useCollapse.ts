import { useToggle } from '@rocket.chat/fuselage-hooks';
import { useAttachmentIsCollapsedByDefault } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import { useIsCollapsibleToggled } from './useIsCollapsibleToggled';
import { RoomManager, useOpenedRoom } from '../../../lib/RoomManager';

// `key` identifies this collapsible within the room's store, so its toggled state survives
// the row unmounting and remounting (e.g. virtua recycling it on scroll), it falls back to
// plain local state.
export const useCollapse = (attachmentCollapsed?: boolean, key?: string) => {
	const collapseByDefault = useAttachmentIsCollapsedByDefault();
	const defaultCollapsed = !!(collapseByDefault || attachmentCollapsed);

	const rid = useOpenedRoom();
	const toggled = useIsCollapsibleToggled(key);
	const [localCollapsed, toggleLocalCollapsed] = useToggle(defaultCollapsed);

	const togglePersistedCollapsed = useCallback(() => {
		if (!key || !rid) {
			return;
		}
		RoomManager.getStore(rid)?.toggleCollapsible(key);
	}, [key, rid]);

	if (key) {
		return [toggled !== defaultCollapsed, togglePersistedCollapsed] as const;
	}

	return [localCollapsed, () => toggleLocalCollapsed()] as const;
};

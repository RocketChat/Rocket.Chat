import { useToggle } from '@rocket.chat/fuselage-hooks';
import { useAttachmentIsCollapsedByDefault } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import { useIsCollapsibleToggled } from './useIsCollapsibleToggled';
import { RoomManager, useOpenedRoom } from '../../../lib/RoomManager';

// `key` identifies this collapsible within the opened room's store, so its toggled state survives
// the row unmounting and remounting (e.g. virtua recycling it on scroll). Without a key, or when
// rendered outside an opened room (e.g. Message Auditing), it falls back to plain local state.
export const useCollapse = (attachmentCollapsed?: boolean, key?: string) => {
	const collapseByDefault = useAttachmentIsCollapsedByDefault();
	const defaultCollapsed = !!(collapseByDefault || attachmentCollapsed);

	const rid = useOpenedRoom();
	const store = rid ? RoomManager.getStore(rid) : undefined;
	const persistedKey = store ? key : undefined;

	const toggled = useIsCollapsibleToggled(persistedKey);
	const [localCollapsed, toggleLocalCollapsed] = useToggle(defaultCollapsed);

	const togglePersistedCollapsed = useCallback(() => {
		if (!persistedKey) {
			return;
		}
		store?.toggleCollapsible(persistedKey);
	}, [persistedKey, store]);

	if (persistedKey) {
		return [toggled !== defaultCollapsed, togglePersistedCollapsed] as const;
	}

	return [localCollapsed, () => toggleLocalCollapsed()] as const;
};

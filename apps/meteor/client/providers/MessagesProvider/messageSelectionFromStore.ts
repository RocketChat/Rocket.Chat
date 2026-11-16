import type { MessageSelectionStore } from '@rocket.chat/ui-message-list';

import type { SelectedMessageStore } from '../../views/room/providers/SelectedMessageStore';

/** The room's selection, as the message components read and toggle it. */
export const messageSelectionFromStore = (store: SelectedMessageStore): MessageSelectionStore => ({
	subscribe: (onStoreChange) => {
		const offChange = store.on('change', onStoreChange);
		const offToggleIsSelecting = store.on('toggleIsSelecting', onStoreChange);
		return () => {
			offChange();
			offToggleIsSelecting();
		};
	},
	isSelecting: () => store.getIsSelecting(),
	isSelected: (messageId) => store.isSelected(messageId),
	toggle: (messageId) => store.toggle(messageId),
});

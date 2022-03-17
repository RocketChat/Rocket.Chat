import { Emitter } from '@rocket.chat/emitter';
import React, { FC, useMemo } from 'react';

import { SelectedMessageContext } from '../MessageList/contexts/SelectedMessagesContext';

// data-qa-select

export const selectedMessageStore = new (class SelectMessageStore extends Emitter<{
	change: undefined;
	[mid: string]: boolean;
}> {
	store = new Set<string>();

	isSelecting = false;

	setIsSelecting(isSelecting: boolean): void {
		this.isSelecting = isSelecting;
		this.emit('toggleSelect', isSelecting);
	}

	getIsSelecting(): boolean {
		return this.isSelecting;
	}

	isSelected(mid: string): boolean {
		return Boolean(this.store.has(mid));
	}

	getSelectedMessages(): string[] {
		return Array.from(this.store);
	}

	toggle(mid: string): void {
		if (this.store.has(mid)) {
			this.store.delete(mid);
			this.emit(mid, false);
			this.emit('change');
			return;
		}
		this.store.add(mid);
		this.emit(mid, true);
		this.emit('change');
	}

	count(): number {
		return this.store.size;
	}
})();

export const SelectedMessagesProvider: FC = ({ children }) => {
	const value = useMemo(
		() => ({
			selectedMessageStore,
			// store: selectedMessageStore.store,
			// subscribe: selectedMessageStore.on.bind(selectedMessageStore),
			// getIsSelecting: selectedMessageStore.getIsSelecting.bind(selectedMessageStore),
			// toggleSelected: selectedMessageStore.toggle.bind(selectedMessageStore),
			// isSelected: selectedMessageStore.isSelected.bind(selectedMessageStore),
			// countSelected: selectedMessageStore.count.bind(selectedMessageStore),
			// setIsSelecting: selectedMessageStore.setIsSelecting.bind(selectedMessageStore),
		}),
		[],
	);

	return <SelectedMessageContext.Provider value={value}>{children}</SelectedMessageContext.Provider>;
};

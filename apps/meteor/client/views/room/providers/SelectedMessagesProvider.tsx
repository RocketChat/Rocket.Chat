import { Emitter } from '@rocket.chat/emitter';
import type { FC } from 'react';
import React, { useMemo } from 'react';

import { SelectedMessageContext } from '../MessageList/contexts/SelectedMessagesContext';

// data-qa-select

export const selectedMessageStore = new (class SelectMessageStore extends Emitter<
	{
		change: undefined;
		toggleIsSelecting: boolean;
	} & { [mid: string]: boolean }
> {
	store = new Set<string>();

	isSelecting = false;

	setIsSelecting(isSelecting: boolean): void {
		this.isSelecting = isSelecting;
		this.emit('toggleIsSelecting', isSelecting);
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

	clearStore(): void {
		const selectedMessages = this.getSelectedMessages();
		this.store.clear();
		selectedMessages.forEach((mid) => this.emit(mid, false));
		this.emit('change');
	}

	reset(): void {
		this.clearStore();
		this.isSelecting = false;
		this.emit('toggleIsSelecting', false);
	}
})();

export const SelectedMessagesProvider: FC = ({ children }) => {
	const value = useMemo(
		() => ({
			selectedMessageStore,
		}),
		[],
	);

	return <SelectedMessageContext.Provider value={value}>{children}</SelectedMessageContext.Provider>;
};

import { Emitter } from '@rocket.chat/emitter';
import type { ReactNode } from 'react';
import { useMemo } from 'react';

import { SelectedMessageContext } from '../MessageList/contexts/SelectedMessagesContext';

export const selectedMessageStore = new (class SelectMessageStore extends Emitter<
	{
		change: undefined;
		toggleIsSelecting: boolean;
	} & { [mid: string]: boolean }
> {
	store = new Set<string>();

	availableMessages = new Set<string>();

	isSelecting = false;

	addAvailableMessage(mid: string): void {
		this.availableMessages.add(mid);
		this.emit('change');
	}

	removeAvailableMessage(mid: string): void {
		this.availableMessages.delete(mid);
		this.emit('change');
	}

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

	availableMessagesCount(): number {
		return this.availableMessages.size;
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

	toggleAll(mids: string[]): void {
		this.store = new Set([...this.store, ...mids]);
		this.emit('change');
	}
})();

type SelectedMessagesProviderProps = {
	children?: ReactNode;
};

export const SelectedMessagesProvider = ({ children }: SelectedMessagesProviderProps) => {
	const value = useMemo(
		() => ({
			selectedMessageStore,
		}),
		[],
	);

	return <SelectedMessageContext.Provider value={value}>{children}</SelectedMessageContext.Provider>;
};

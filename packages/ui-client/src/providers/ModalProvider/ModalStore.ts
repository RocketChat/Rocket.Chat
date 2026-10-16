import { Emitter } from '@rocket.chat/emitter';
import type { ReactNode } from 'react';

type ModalInstance = {
	close: () => void;
	cancel: () => void;
};

type ModalWithRegion = { node: ReactNode; region?: symbol };

class ModalStore extends Emitter<{ update: void }> {
	private modalStack: ModalWithRegion[] = [];

	update(): void {
		this.emit('update');
	}

	// open function erases all other modals from the stack
	open = (node: ReactNode, region?: symbol): ModalInstance => {
		const modal = { node, region };
		this.modalStack = [modal];
		this.update();

		return this.createInstance(modal);
	};

	push = (node: ReactNode, region?: symbol): ModalInstance => {
		const modal = { node, region };
		this.modalStack = [...this.modalStack, modal];
		this.update();

		return this.createInstance(modal);
	};

	// An instance removes its own modal, wherever it sits in the stack, and does nothing once that modal is gone.
	private createInstance(modal: ModalWithRegion): ModalInstance {
		const remove = () => {
			if (!this.modalStack.includes(modal)) {
				return;
			}

			this.modalStack = this.modalStack.filter((entry) => entry !== modal);
			this.update();
		};

		return { close: remove, cancel: remove };
	}

	close = (): void => {
		this.modalStack = this.modalStack.slice(0, -1);
		this.update();
	};

	subscribe = (cb: () => void): (() => void) => {
		this.on('update', cb);

		return () => this.off('update', cb);
	};

	getSnapshot = (): ModalWithRegion | null => this.current;

	get current(): ModalWithRegion | null {
		return this.modalStack[this.modalStack.length - 1] ?? null;
	}
}

export const modalStore = new ModalStore();

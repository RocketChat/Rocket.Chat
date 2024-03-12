import { Emitter } from '@rocket.chat/emitter';
import type { ReactNode } from 'react';

// type ReactModalDescriptor<TProps> = {
// 	component: ComponentType<TProps>;
// 	props?: TProps;
// };

// type ModalDescriptor = ReactModalDescriptor<Record<string, unknown>> | null;

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
		this.modalStack = [{ node, region }];
		this.update();

		return {
			close: () => {
				this.modalStack = this.modalStack.filter((modal) => modal !== this.current);
				this.update();
			},
			cancel: this.close,
		};
	};

	push = (node: ReactNode, region?: symbol): ModalInstance => {
		this.modalStack = [...this.modalStack, { node, region }];
		this.update();

		return {
			close: () => {
				this.modalStack = this.modalStack.filter((modal) => modal !== this.current);
				this.update();
			},
			cancel: this.close,
		};
	};

	close = (): void => {
		this.modalStack = this.modalStack.slice(0, -1);
		this.update();
	};

	subscribe = (cb: () => void): (() => void) => {
		this.on('update', cb);

		return () => this.off('update', cb);
	};

	getSnapshot = (): ModalWithRegion | null => {
		return this.current;
	};

	get current(): ModalWithRegion | null {
		return this.modalStack[this.modalStack.length - 1] ?? null;
	}
}

export const modalStore = new ModalStore();

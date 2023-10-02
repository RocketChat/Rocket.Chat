import { Emitter } from '@rocket.chat/emitter';
import type { ComponentType } from 'react';

type ReactModalDescriptor<TProps> = {
	component: ComponentType<TProps>;
	props?: TProps;
};

type ModalDescriptor = ReactModalDescriptor<Record<string, unknown>> | null;

type ModalInstance = {
	close: () => void;
	cancel: () => void;
};

class ImperativeModalEmmiter extends Emitter<{ update: ModalDescriptor }> {
	private modalStack: ModalDescriptor[] = [];

	update(descriptor: ModalDescriptor): void {
		this.emit('update', descriptor);
	}

	open = <TProps>(descriptor: ReactModalDescriptor<TProps>): ModalInstance => {
		this.modalStack = [descriptor as ModalDescriptor];
		// There are some TS shenanigans causing errors if this is not asserted
		// Since this method is for internal use only, it's ok to use this here
		// This will not affect prop types inference when using the method.
		this.update(descriptor as ModalDescriptor);

		return {
			close: () => {
				this.modalStack = this.modalStack.filter((modal) => modal !== this.current);
				this.update(this.current);
			},
			cancel: this.close,
		};
	};

	push = <TProps>(descriptor: ReactModalDescriptor<TProps>): ModalInstance => {
		this.modalStack = [...this.modalStack, descriptor as ModalDescriptor];
		this.update(descriptor as ModalDescriptor);

		return {
			close: () => {
				this.modalStack = this.modalStack.filter((modal) => modal !== this.current);
				this.update(this.current);
			},
			cancel: this.close,
		};
	};

	close = (): void => {
		this.modalStack = this.modalStack.slice(0, -1);
		this.update(this.current);
	};

	get current(): ModalDescriptor {
		return this.modalStack[this.modalStack.length - 1] ?? null;
	}
}

export const imperativeModal = new ImperativeModalEmmiter();

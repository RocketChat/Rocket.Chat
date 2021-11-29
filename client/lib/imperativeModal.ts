import { Emitter } from '@rocket.chat/emitter';
import { ComponentType } from 'react';

type PropType = Record<string, unknown>;

type ReactModalDescriptor<Props extends PropType> = {
	component: ComponentType<Props>;
	props?: Props;
};

type ModalDescriptor = ReactModalDescriptor<PropType> | null;

class ImperativeModalEmmiter extends Emitter<{ update: ModalDescriptor }> {
	update(descriptor: ModalDescriptor): void {
		this.emit('update', descriptor);
	}

	open = <Props extends PropType>(descriptor: ReactModalDescriptor<Props> | null): void => {
		// There are some TS shenanigans causing errors if this is not asserted
		// Since this method is for internal use only, it's ok to use this here
		// This will not affect prop types inference when using the method.
		this.update(descriptor as ModalDescriptor);
	};

	close = (): void => {
		this.update(null);
	};
}

export const imperativeModal = new ImperativeModalEmmiter();

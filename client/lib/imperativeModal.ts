import { Emitter } from '@rocket.chat/emitter';
import { ComponentType } from 'react';

type ReactModalDescriptor<Props extends {} = {}> = {
	component: ComponentType<Props>;
	props?: Props;
};

type ModalDescriptor = ReactModalDescriptor | null;

class ImperativeModalEmmiter extends Emitter<{ update: ModalDescriptor }> {
	setCurrentValue(descriptor: ModalDescriptor): void {
		this.emit('update', descriptor);
	}

	open = (templateOrDescriptor: ModalDescriptor): void => {
		this.setCurrentValue(templateOrDescriptor);
	};

	close = (): void => {
		this.setCurrentValue(null);
	};
}

export const imperativeModal = new ImperativeModalEmmiter();

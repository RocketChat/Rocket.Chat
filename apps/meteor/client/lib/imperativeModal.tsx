import { Emitter } from '@rocket.chat/emitter';
import { createElement } from 'react';
import type { ComponentProps, ComponentType, ReactNode } from 'react';

import { modalStore } from '../providers/ModalProvider/ModalStore';

type ReactModalDescriptor<TComponent extends ComponentType<any> = ComponentType<any>> = {
	component: TComponent;
	props?: ComponentProps<TComponent>;
};

type ModalDescriptor = ReactModalDescriptor | null;

type ModalInstance = {
	close: () => void;
	cancel: () => void;
};

const mapCurrentModal = (descriptor: ModalDescriptor): ReactNode => {
	if (descriptor === null) {
		return null;
	}

	if ('component' in descriptor) {
		return createElement(descriptor.component, {
			key: Math.random(),
			...descriptor.props,
		});
	}
};

class ImperativeModalEmmiter extends Emitter<{ update: ModalDescriptor }> {
	private store: typeof modalStore;

	constructor(store: typeof modalStore) {
		super();
		this.store = store;
	}

	open = <TComponent extends ComponentType<any>>(descriptor: ReactModalDescriptor<TComponent>): ModalInstance => {
		return this.store.open(mapCurrentModal(descriptor as ModalDescriptor));
	};

	push = <TComponent extends ComponentType<any>>(descriptor: ReactModalDescriptor<TComponent>): ModalInstance => {
		return this.store.push(mapCurrentModal(descriptor as ModalDescriptor));
	};

	close = () => {
		this.store.close();
	};
}

export const imperativeModal = new ImperativeModalEmmiter(modalStore);

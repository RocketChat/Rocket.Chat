import { Emitter } from '@rocket.chat/emitter';
import React, { Suspense, createElement } from 'react';
import type { ComponentType, ReactNode } from 'react';

import { modalStore } from '../providers/ModalProvider/ModalStore';

type ReactModalDescriptor<TProps> = {
	component: ComponentType<TProps>;
	props?: TProps;
};

type ModalDescriptor = ReactModalDescriptor<Record<string, unknown>> | null;

type ModalInstance = {
	close: () => void;
	cancel: () => void;
};

const mapCurrentModal = (descriptor: ModalDescriptor): ReactNode => {
	if (descriptor === null) {
		return null;
	}

	if ('component' in descriptor) {
		return (
			<Suspense fallback={<div />}>
				{createElement(descriptor.component, {
					key: Math.random(),
					...descriptor.props,
				})}
			</Suspense>
		);
	}
};

class ImperativeModalEmmiter extends Emitter<{ update: ModalDescriptor }> {
	private store: typeof modalStore;

	constructor(store: typeof modalStore) {
		super();
		this.store = store;
	}

	open = <TProps,>(descriptor: ReactModalDescriptor<TProps>): ModalInstance => {
		return this.store.open(mapCurrentModal(descriptor as ModalDescriptor));
	};

	push = <TProps,>(descriptor: ReactModalDescriptor<TProps>): ModalInstance => {
		return this.store.push(mapCurrentModal(descriptor as ModalDescriptor));
	};

	close = () => {
		this.store.close();
	};
}

export const imperativeModal = new ImperativeModalEmmiter(modalStore);

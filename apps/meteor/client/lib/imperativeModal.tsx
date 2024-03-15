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
	open = <TProps,>(descriptor: ReactModalDescriptor<TProps>): ModalInstance => {
		return modalStore.open(mapCurrentModal(descriptor as ModalDescriptor));
	};

	push = <TProps,>(descriptor: ReactModalDescriptor<TProps>): ModalInstance => {
		return modalStore.push(mapCurrentModal(descriptor as ModalDescriptor));
	};

	close = modalStore.close;
}

export const imperativeModal = new ImperativeModalEmmiter();

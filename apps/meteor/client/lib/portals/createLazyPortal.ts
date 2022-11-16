import { ComponentType, PropsWithoutRef, ReactPortal } from 'react';
import { createPortal } from 'react-dom';

import { createLazyElement } from './createLazyElement';

export const createLazyPortal = <Props>(
	factory: () => Promise<{ default: ComponentType<Props> }>,
	getProps: () => PropsWithoutRef<Props> | undefined,
	container: Element,
): ReactPortal => createPortal(createLazyElement(factory, getProps), container);

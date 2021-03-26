import type { ComponentType, PropsWithoutRef, ReactPortal } from 'react';

import { createLazyElement } from './createLazyElement';

export const createLazyPortal = async <Props extends {} = {}>(
	factory: () => Promise<{ default: ComponentType<Props> }>,
	getProps: () => PropsWithoutRef<Props> | undefined,
	container: Element,
): Promise<ReactPortal> => {
	const { createPortal } = await import('react-dom');
	return createPortal(await createLazyElement(factory, getProps), container);
};

import type { ComponentType, PropsWithoutRef } from 'react';

import { createLazyPortal } from './createLazyPortal';
import { registerPortal } from './portalsSubscription';

export const createEphemeralPortal = <Props extends {} = {}>(
	factory: () => Promise<{ default: ComponentType<Props> }>,
	propsFn: () => PropsWithoutRef<Props>,
	container: Element,
): (() => void) => {
	const portal = createLazyPortal(factory, propsFn, container);
	return registerPortal(container, portal);
};

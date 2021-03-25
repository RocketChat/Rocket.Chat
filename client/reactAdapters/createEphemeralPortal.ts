import type { ComponentType, PropsWithoutRef } from 'react';

import { portalsSubscription, registerPortal, unregisterPortal } from './portalsSubscription';
import { mountRoot } from './mountRoot';
import { createLazyPortal } from './createLazyPortal';

export {
	portalsSubscription,
	mountRoot,
	registerPortal,
	unregisterPortal,
};

export const createEphemeralPortal = async <Props extends {} = {}>(
	factory: () => Promise<{ default: ComponentType<Props> }>,
	propsFn: () => PropsWithoutRef<Props>,
	container: Element,
): Promise<() => void> => {
	const portal = await createLazyPortal(factory, propsFn, container);
	return registerPortal(container, portal);
};

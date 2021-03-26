import type { ComponentType, PropsWithoutRef } from 'react';

import { createLazyPortal } from './createLazyPortal';
import { mountRoot } from './mountRoot';
import { portalsSubscription, registerPortal, unregisterPortal } from './portalsSubscription';

export { portalsSubscription, mountRoot, registerPortal, unregisterPortal };

export const createEphemeralPortal = async <Props extends {} = {}>(
	factory: () => Promise<{ default: ComponentType<Props> }>,
	propsFn: () => PropsWithoutRef<Props>,
	container: Element,
): Promise<() => void> => {
	const portal = await createLazyPortal(factory, propsFn, container);
	return registerPortal(container, portal);
};

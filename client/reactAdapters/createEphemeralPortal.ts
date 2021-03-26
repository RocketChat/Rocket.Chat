import type { ComponentType, PropsWithoutRef } from 'react';

import { createLazyPortal } from './createLazyPortal';
import { registerPortal } from './portalsSubscription';

export const createEphemeralPortal = async <Props extends {} = {}>(
	factory: () => Promise<{ default: ComponentType<Props> }>,
	propsFn: () => PropsWithoutRef<Props>,
	container: Element,
): Promise<() => void> => {
	const portal = await createLazyPortal(factory, propsFn, container);
	return registerPortal(container, portal);
};

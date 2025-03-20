import { createReactiveSubscriptionFactory } from './createReactiveSubscriptionFactory';

export const createSubscription = function <T>(
	getValue: () => T,
): [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => T] {
	return createReactiveSubscriptionFactory(getValue)();
};

import React, { ComponentType, lazy, ReactElement, Suspense } from 'react';

import PageLoading from '../views/root/PageLoading';

export const lazyLayout = <P,>(
	factory: () => Promise<{ default: ComponentType<P> }>,
): ComponentType<P> => {
	const LazyComponent = lazy(factory);

	return function LazyLayout(props: P): ReactElement {
		return (
			<Suspense fallback={<PageLoading />}>
				<LazyComponent {...props} />
			</Suspense>
		);
	};
};

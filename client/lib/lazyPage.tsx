import React, { ComponentType, lazy, ReactElement, Suspense } from 'react';

import PageSkeleton from '../components/PageSkeleton';

export const lazyPage = <P,>(
	factory: () => Promise<{ default: ComponentType<P> }>,
): ComponentType<P> => {
	const LazyComponent = lazy(factory);

	return function LazyPage(props: P): ReactElement {
		return (
			<Suspense fallback={<PageSkeleton />}>
				<LazyComponent {...props} />
			</Suspense>
		);
	};
};

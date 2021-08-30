/* eslint-disable react/no-multi-comp */
import React, { ComponentType, lazy, PropsWithoutRef, ReactElement, Suspense } from 'react';

import AppLayout from '../views/root/AppLayout';
import PageLoading from '../views/root/PageLoading';
import { createTemplateForComponent } from './portals/createTemplateForComponent';

export const lazyLayout = <P,>(
	factory: () => Promise<{ default: ComponentType<P> }>,
): ComponentType<P> => {
	const LazyComponent = lazy(factory);

	return function LazyLayout(props: P): ReactElement {
		return (
			<Suspense fallback={<PageLoading />}>
				<LazyComponent {...props} />
				<AppLayout />
			</Suspense>
		);
	};
};

export const lazyMainLayout = <P,>(
	templateName: string,
	factory: () => Promise<{ default: ComponentType<P> }>,
	props?: () => PropsWithoutRef<P>,
): ComponentType<{}> => {
	const template = createTemplateForComponent(templateName, factory, {
		attachment: 'at-parent',
		props,
	});

	return function LazyMainLayout(): ReactElement {
		return (
			<Suspense fallback={<PageLoading />}>
				<AppLayout template='main' center={template} />
			</Suspense>
		);
	};
};

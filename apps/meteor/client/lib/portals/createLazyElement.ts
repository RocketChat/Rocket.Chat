import type { ComponentType, ReactElement, PropsWithoutRef, FC } from 'react';
import { createElement, lazy, Suspense } from 'react';

import { useReactiveValue } from '../../hooks/useReactiveValue';

export const createLazyElement = <Props>(
	factory: () => Promise<{ default: ComponentType<Props> }>,
	getProps?: () => PropsWithoutRef<Props> | undefined,
): ReactElement => {
	const LazyComponent = lazy(factory);

	if (!getProps) {
		return createElement(LazyComponent);
	}

	const WrappedComponent: FC = () => {
		const props = useReactiveValue(getProps);
		return createElement(Suspense, { fallback: null }, createElement(LazyComponent, props));
	};

	return createElement(WrappedComponent);
};

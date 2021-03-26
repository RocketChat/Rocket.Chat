import { Tracker } from 'meteor/tracker';
import type { ComponentType, ReactElement, PropsWithoutRef } from 'react';

export const createLazyElement = async <Props extends {} = {}>(
	factory: () => Promise<{ default: ComponentType<Props> }>,
	getProps?: () => PropsWithoutRef<Props> | undefined,
): Promise<ReactElement> => {
	const { createElement, lazy, useEffect, useState, memo, Suspense } = await import('react');
	const LazyComponent = lazy(factory);

	if (!getProps) {
		return createElement(LazyComponent);
	}

	const WrappedComponent = memo(() => {
		const [props, setProps] = useState(() => Tracker.nonreactive(getProps));

		useEffect(() => {
			const computation = Tracker.autorun(() => {
				setProps(getProps());
			});

			return (): void => {
				computation.stop();
			};
		}, []);

		return createElement(Suspense, { fallback: null }, createElement(LazyComponent, props));
	});

	return createElement(WrappedComponent);
};

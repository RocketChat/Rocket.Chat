import { Tracker } from 'meteor/tracker';
import { ComponentType, ReactElement, PropsWithoutRef, createElement, lazy, useEffect, useState, Suspense, FC } from 'react';

export const createLazyElement = <Props>(
	factory: () => Promise<{ default: ComponentType<Props> }>,
	getProps?: () => PropsWithoutRef<Props> | undefined,
): ReactElement => {
	const LazyComponent = lazy(factory);

	if (!getProps) {
		return createElement(LazyComponent);
	}

	const WrappedComponent: FC = () => {
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
	};

	return createElement(WrappedComponent);
};

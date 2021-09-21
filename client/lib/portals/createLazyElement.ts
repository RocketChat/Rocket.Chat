import { Tracker } from 'meteor/tracker';
import {
	ComponentType,
	ReactElement,
	PropsWithoutRef,
	createElement,
	lazy,
	useEffect,
	useState,
	Suspense,
	FC,
	cloneElement,
} from 'react';

export const createLazyElement = <Props extends {} = {}>(
	factory: () => Promise<{ default: ComponentType<Props> }>,
	getProps?: () => PropsWithoutRef<Props> | undefined,
	context?: Element,
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
		const el = createElement(Suspense, { fallback: null }, createElement(LazyComponent, props));
		return context !== undefined ? cloneElement(context, [], [el]) : el;
	};

	return createElement(WrappedComponent);
};

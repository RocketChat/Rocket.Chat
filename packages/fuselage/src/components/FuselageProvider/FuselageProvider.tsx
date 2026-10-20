import { ThemeProvider } from '@tamagui/web';
import { createContext, useContext, type ComponentType, type ReactNode } from 'react';

import { useArrayLikeClassNameProp } from '../../hooks/useArrayLikeClassNameProp';
import { tamaguiConfig } from '../../tamagui.config';
import { BoxTransforms, useBoxTransform } from '../Box/BoxTransforms';
import { useStylingProps } from '../Box/useStylingProps';

// Read before anything renders, so it holds only the base rules and none of the atomic ones; the layer order
// repeats `index.css` for pages that load `fuselage.css` after this
const baseCSS = `@layer reset, fuselage;\n${tamaguiConfig.getCSS()}`;

const FuselageProviderContext = createContext(false);

export type FuselageProviderProps = {
	children?: ReactNode;
};

/** Lets the Fuselage components under it share one Tamagui root instead of each mounting its own; it adds no elements around them. */
const FuselageProvider = ({ children }: FuselageProviderProps) => (
	<FuselageProviderContext.Provider value>
		{/* jsdom cannot parse the base stylesheet, and tests don't need it */}
		{process.env.NODE_ENV !== 'test' && (
			<style href='fuselage-tamagui' precedence='default'>
				{baseCSS}
			</style>
		)}
		<ThemeProvider defaultTheme='light'>{children}</ThemeProvider>
	</FuselageProviderContext.Provider>
);

type BoxTransform = (props: Record<string, unknown>) => Record<string, unknown>;

export type WithFuselageProviderOptions = {
	/**
	 * The component used to render a `Box` at its root, so it is the one that takes what a `BoxTransforms`
	 * ancestor such as `Margins` or `Scrollable` hands to the first `Box` below it.
	 */
	takesBoxTransforms?: boolean;
};

/** Keeps a Tamagui-based component renderable in trees that never mounted a `FuselageProvider`. */
export const withFuselageProvider = <TProps extends object>(
	Component: ComponentType<TProps>,
	{ takesBoxTransforms = false }: WithFuselageProviderOptions = {},
) => {
	const WithRoot = (props: TProps) => {
		if (useContext(FuselageProviderContext)) {
			return <Component {...props} />;
		}

		return (
			<FuselageProvider>
				<Component {...props} />
			</FuselageProvider>
		);
	};

	const WithBoxTransform = ({ transform, props }: { transform: BoxTransform; props: TProps }) => {
		const ownProps = useArrayLikeClassNameProp({ ...(props as Record<string, unknown>) });
		const transformed = transform({ ...ownProps });
		const added = Object.fromEntries(
			Object.entries(transformed).filter(([key, value]) => ownProps[key] === undefined && value !== undefined),
		);
		// Only styling props the transform added become a class name; the component's own props keep their meaning
		const { className: stylingClassName, ...addedNonStyling } = useStylingProps({ ...added, className: '' });
		const finalProps = Object.fromEntries(Object.entries(transformed).filter(([key]) => !(key in added) || key in addedNonStyling));
		finalProps.className = [transformed.className, stylingClassName].filter(Boolean).join(' ');

		return (
			<BoxTransforms.Provider value={null}>
				<WithRoot {...(finalProps as TProps)} />
			</BoxTransforms.Provider>
		);
	};

	const WithFuselageProvider: ((props: TProps) => ReactNode) & { displayName?: string } = takesBoxTransforms
		? (props: TProps) => {
				const transform = useBoxTransform();

				if (transform) {
					return <WithBoxTransform transform={transform} props={props} />;
				}

				return <WithRoot {...props} />;
			}
		: WithRoot;

	WithFuselageProvider.displayName = `WithFuselageProvider(${Component.displayName || Component.name || 'Component'})`;
	tamaguiComponents.add(WithFuselageProvider);

	return WithFuselageProvider;
};

const tamaguiComponents = new WeakSet<object>();

/** Tells whether a component renders a Tamagui frame, which `rcx-box` base classes would override. */
export const isTamaguiComponent = (type: unknown): boolean => {
	if (!type || (typeof type !== 'function' && typeof type !== 'object')) {
		return false;
	}

	// `memo()` wraps the component in an object that keeps it under `type`
	return tamaguiComponents.has(type) || isTamaguiComponent((type as { type?: unknown }).type);
};

export default FuselageProvider;

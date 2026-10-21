import { ThemeProvider } from '@tamagui/web';
import type { ComponentType, ReactNode } from 'react';

// Creates the Tamagui config before any frame renders
import '../../tamagui.config';
import { useArrayLikeClassNameProp } from '../../hooks/useArrayLikeClassNameProp';
import { BoxTransforms, useBoxTransform } from '../Box/BoxTransforms';
import { useStylingProps } from '../Box/useStylingProps';

export type FuselageProviderProps = {
	children?: ReactNode;
};

/**
 * Lets the Fuselage components under it share one Tamagui root instead of each acting as its own; it adds no elements
 * around them. Optional: Tamagui's base stylesheet ships in `fuselage.css`.
 */
const FuselageProvider = ({ children }: FuselageProviderProps) => <ThemeProvider defaultTheme='light'>{children}</ThemeProvider>;

type BoxTransform = (props: Record<string, unknown>) => Record<string, unknown>;

export type WithFuselageProviderOptions = {
	/**
	 * The component used to render a `Box` at its root, so it is the one that takes what a `BoxTransforms`
	 * ancestor such as `Margins` or `Scrollable` hands to the first `Box` below it.
	 */
	takesBoxTransforms?: boolean;
};

/** Registers a Tamagui-based component, and has it take `BoxTransforms` when it stands in for a `Box`. */
export const withFuselageProvider = <TProps extends object>(
	Component: ComponentType<TProps>,
	{ takesBoxTransforms = false }: WithFuselageProviderOptions = {},
) => {
	// A frame with no provider above acts as its own Tamagui root (patched `@tamagui/web`), so no fallback is mounted
	const WithRoot = Component as (props: TProps) => ReactNode;

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

	if (WithFuselageProvider !== WithRoot) {
		WithFuselageProvider.displayName = `WithFuselageProvider(${Component.displayName || Component.name || 'Component'})`;
	}
	tamaguiComponents.add(WithFuselageProvider);

	return WithFuselageProvider;
};

const tamaguiComponents = new WeakSet<object>();

/** Tells whether a component renders a Tamagui frame, which `rcx-box` base classes would override. */
export const isTamaguiComponent = (type: unknown): boolean => {
	if (!type || (typeof type !== 'function' && typeof type !== 'object')) {
		return false;
	}

	// An exported frame carries its `staticConfig`; `memo()` wraps the component in an object that keeps it under `type`
	return tamaguiComponents.has(type) || 'staticConfig' in type || isTamaguiComponent((type as { type?: unknown }).type);
};

export default FuselageProvider;

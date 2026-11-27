import { extractNativeStyle } from './nativeStyle';
import type { StylingProps } from './stylingProps';

/** The native twin of `useStylingProps`: the styling props become a `style`, since there is no stylesheet to attach a class to. */
export const useStylingProps = <TProps extends { className?: string; style?: unknown }>(
	originalProps: TProps,
): Omit<TProps, keyof StylingProps> => {
	const [props, style, hostProps] = extractNativeStyle(originalProps);

	return {
		...props,
		...hostProps,
		...(Object.keys(style).length ? { style: props.style ? [props.style, style] : style } : undefined),
	};
};

import type { PositionStyle, VirtualizerStyle } from '../types/ElementAttributes';
import {
	positionStyleKeys,
	virtualizerStyleKeys,
	webAnimationHandlerKeys,
	webCaptureHandlerKeys,
	webDropHandlerKeys,
	webPressHandlerKeys,
	webRowHandlerKeys,
	webTextInputHandlerKeys,
} from '../types/ElementAttributes';

const noAttributes = Object.freeze({});

const pick = <const TKeys extends readonly string[]>(keys: TKeys) => {
	const wanted = new Set<string>(keys);

	return <TProps extends object>(props: TProps): Pick<TProps, Extract<TKeys[number], keyof TProps>> => {
		let picked: Record<string, unknown> | undefined;
		for (const key in props) {
			if (wanted.has(key)) {
				const value = (props as Record<string, unknown>)[key];
				if (value !== undefined) (picked ??= {})[key] = value;
			}
		}
		return (picked ?? noAttributes) as Pick<TProps, Extract<TKeys[number], keyof TProps>>;
	};
};

/** The `WebPressHandlers` a consumer passed, to spread on the literal render element. */
export const pickWebPressHandlers = pick(webPressHandlerKeys);

/** The `WebRowHandlers` a consumer passed, to spread on the literal render element. */
export const pickWebRowHandlers = pick(webRowHandlerKeys);

/** The `WebTextInputHandlers` a consumer passed, to spread on the literal render element. */
export const pickWebTextInputHandlers = pick(webTextInputHandlerKeys);

/** The `WebDropHandlers` a consumer passed, to spread on the literal render element. */
export const pickWebDropHandlers = pick(webDropHandlerKeys);

/** The `WebCaptureHandlers` a consumer passed, to spread on the literal render element. */
export const pickWebCaptureHandlers = pick(webCaptureHandlerKeys);

/** The `WebAnimationHandlers` a consumer passed, to spread on the literal render element. */
export const pickWebAnimationHandlers = pick(webAnimationHandlerKeys);

/** The `style` a `Position` handed the part, narrowed to `PositionStyle`, to spread on the literal render element. */
export const pickPositionStyle = ({ style }: { style?: object }): { style?: PositionStyle } => {
	if (!style) return {};
	const picked = pick(positionStyleKeys)(style);
	return Object.keys(picked).length > 0 ? { style: picked } : {};
};

/** The `style` a virtualizer handed the list or the row, narrowed to `VirtualizerStyle`, to spread on the literal render element. */
export const pickVirtualizerStyle = ({ style }: { style?: object }): { style?: VirtualizerStyle } => {
	if (!style) return {};
	const picked = pick(virtualizerStyleKeys)(style);
	return Object.keys(picked).length > 0 ? { style: picked } : {};
};

/** The `title` of a part that renders an `svg`, whose typings leave the attribute out, to spread on the literal render element. */
export const pickSvgTitle = ({ title }: { title?: string }): { title?: string } => (title === undefined ? {} : { title });

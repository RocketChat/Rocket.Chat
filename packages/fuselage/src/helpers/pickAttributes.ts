import { webCaptureHandlerKeys, webDropHandlerKeys, webPressHandlerKeys } from '../types/ElementAttributes';

const pick =
	<const TKeys extends readonly string[]>(keys: TKeys) =>
	<TProps extends object>(props: TProps): Pick<TProps, Extract<TKeys[number], keyof TProps>> => {
		const picked: Record<string, unknown> = {};
		for (const key of keys) {
			const value = (props as Record<string, unknown>)[key];
			if (value !== undefined) picked[key] = value;
		}
		return picked as Pick<TProps, Extract<TKeys[number], keyof TProps>>;
	};

/** The `WebPressHandlers` a consumer passed, to spread on the literal render element. */
export const pickWebPressHandlers = pick(webPressHandlerKeys);

/** The `WebDropHandlers` a consumer passed, to spread on the literal render element. */
export const pickWebDropHandlers = pick(webDropHandlerKeys);

/** The `WebCaptureHandlers` a consumer passed, to spread on the literal render element. */
export const pickWebCaptureHandlers = pick(webCaptureHandlerKeys);

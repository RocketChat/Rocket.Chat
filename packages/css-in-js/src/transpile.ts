import { createLogicalPropertiesMiddleware } from '@rocket.chat/stylis-logical-props-middleware';
import type { Middleware } from 'stylis';
import { compile, middleware, prefixer, serialize, stringify } from 'stylis';

type MiddlewareOptions = {
	isPropertySupported?: (property: string) => boolean;
	isPropertyValueSupported?: (property: string, value: string) => boolean;
};

export const createTranspileMiddleware = (options: MiddlewareOptions = {}): Middleware =>
	middleware([createLogicalPropertiesMiddleware(options), prefixer, stringify]);

const defaultMiddleware = createTranspileMiddleware();

/**
 * Transpiles CSS Modules content to CSS rules.
 */
export const transpile = (selector: string, content: string, middleware: Middleware = defaultMiddleware): string =>
	serialize(compile(`${selector}{${content}}`), middleware);

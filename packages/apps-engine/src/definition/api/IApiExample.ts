/**
 * A sample call to an endpoint, shown to whoever is reading the App's API.
 *
 * It documents the endpoint; the engine never sends it.
 */
export interface IApiExample {
	/** Sample values for the path parameters. */
	params?: { [key: string]: string };
	/** A sample query string, parsed. */
	query?: { [key: string]: string };
	/** Sample headers. */
	headers?: { [key: string]: string };
	/** A sample request body. */
	content?: any;
}

/**
 * Attaches an {@link IApiExample} to the endpoint method it decorates, so the
 * sample shows up next to the method it illustrates.
 */
export function example(options: IApiExample) {
	return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
		target.examples = target.examples || {};
		target.examples[propertyKey] = options;
	};
}

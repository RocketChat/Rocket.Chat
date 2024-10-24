/**
 * Represents the parameters of an api example.
 */
export interface IApiExample {
    params?: { [key: string]: string };
    query?: { [key: string]: string };
    headers?: { [key: string]: string };
    content?: any;
}

/**
 * Decorator to describe api examples
 */
export function example(options: IApiExample) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        target.examples = target.examples || {};
        target.examples[propertyKey] = options;
    };
}

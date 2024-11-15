/**
 * Represents the parameters of an api example.
 */
export interface IApiExample {
    params?: {
        [key: string]: string;
    };
    query?: {
        [key: string]: string;
    };
    headers?: {
        [key: string]: string;
    };
    content?: any;
}
/**
 * Decorator to describe api examples
 */
export declare function example(options: IApiExample): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;

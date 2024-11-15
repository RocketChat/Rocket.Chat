export declare class Utilities {
    static deepClone<T>(item: T): T;
    static deepFreeze<T>(item: any): T;
    static deepCloneAndFreeze<T>(item: T): T;
    static omit(object: {
        [key: string]: any;
    }, keys: Array<string>): {
        [key: string]: any;
    };
}

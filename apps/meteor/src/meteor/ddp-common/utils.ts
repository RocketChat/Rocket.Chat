export const hasOwn = Object.prototype.hasOwnProperty;
export const slice = Array.prototype.slice;

export function keys(obj: any): string[] {
    return Object.keys(Object(obj));
}

export function isEmpty(obj: any): boolean {
    if (obj == null) {
        return true;
    }

    if (Array.isArray(obj) || typeof obj === 'string') {
        return obj.length === 0;
    }

    for (const key in obj) {
        if (hasOwn.call(obj, key)) {
            return false;
        }
    }

    return true;
}

export function last<T>(array: T[] | null | undefined): T | undefined;
export function last<T>(array: T[] | null | undefined, n?: number, guard?: boolean): T | T[] | undefined {
    if (array == null) {
        return undefined;
    }

    if (n == null || guard) {
        return array[array.length - 1];
    }

    return slice.call(array, Math.max(array.length - n, 0)) as T[];
}
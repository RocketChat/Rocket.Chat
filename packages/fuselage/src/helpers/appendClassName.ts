import type { cssFn } from '@rocket.chat/css-in-js';

type R<T> = T extends void ? string : T extends string ? string : T extends cssFn ? (string | cssFn)[] : string[];

export const appendClassName = <T extends string | string[] | cssFn | undefined>(currentClassName: T, newClassName: string): R<T> => {
	if (currentClassName === undefined || currentClassName === '') {
		return newClassName as R<T>;
	}

	if (Array.isArray(currentClassName)) {
		return [...currentClassName, newClassName] as R<T>;
	}

	if (typeof currentClassName === 'function') {
		return [currentClassName, newClassName] as R<T>;
	}

	return `${currentClassName} ${newClassName}` as R<T>;
};

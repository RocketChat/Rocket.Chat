type R<T> = T extends void ? string : T extends string ? string : string[];

export const appendClassName = <T extends string | string[] | undefined>(currentClassName: T, newClassName: string): R<T> => {
	if (currentClassName === undefined || currentClassName === '') {
		return newClassName as R<T>;
	}

	if (Array.isArray(currentClassName)) {
		return [...currentClassName, newClassName] as R<T>;
	}

	return `${currentClassName} ${newClassName}` as R<T>;
};

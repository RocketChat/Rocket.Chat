export const capitalize = <T extends string>(s: T): Capitalize<T> => {
	if (typeof s !== 'string') {
		return '' as Capitalize<T>;
	}

	return (s.charAt(0).toUpperCase() + s.slice(1)) as Capitalize<T>;
};

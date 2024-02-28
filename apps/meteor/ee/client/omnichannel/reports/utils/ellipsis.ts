export const ellipsis = (value: string | number, max: number) => {
	return String(value).length > max ? `${String(value).substring(0, max)}...` : value;
};

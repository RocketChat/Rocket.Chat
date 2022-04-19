export function truncate(str: string, length: number): string {
	return str.length > length ? `${str.slice(0, length - 3)}...` : str;
}

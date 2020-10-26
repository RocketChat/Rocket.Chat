export function debounce(func: (...args: any[]) => any, wait: number): (...args: any[]) => any {
	let timeout: NodeJS.Timer;

	return (...args: any[]): void => {
		if (timeout) { clearTimeout(timeout); }
		timeout = setTimeout(() => func(...args), wait);
	};
}

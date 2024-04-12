export function debounce(func, wait) {
	let timeout;

	return (...args) => {
		if (timeout) clearTimeout(timeout);
		timeout = setTimeout(() => func(...args), wait);
	};
}

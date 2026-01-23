export const purgeAllDrafts = (): void => {
	Object.keys(localStorage)
		.filter((key) => key.indexOf('messagebox_') === 0)
		.forEach((key) => localStorage.removeItem(key));
};

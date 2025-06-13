export const extractURIfromURL = (url: URL): string => {
	return `${url.pathname}${url.search}`;
};

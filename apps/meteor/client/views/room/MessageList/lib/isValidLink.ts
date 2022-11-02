export const isValidLink = (link: string): boolean => {
	try {
		return Boolean(new URL(link));
	} catch (error) {
		return false;
	}
};

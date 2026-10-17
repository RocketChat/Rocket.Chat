type SearchItem = {
	name?: string;
	fname?: string;
};

export const isExactSearchMatch = (item: SearchItem, searchTerm: string): boolean => {
	const cleanName = searchTerm.trim().toLowerCase();
	return Boolean(cleanName && (item.name?.trim().toLowerCase() === cleanName || item.fname?.trim().toLowerCase() === cleanName));
};

export const orderSearchResults = <T extends SearchItem>(localRooms: T[], fromServer: T[], searchTerm: string): T[] => {
	const exactLocal = localRooms.filter((item) => isExactSearchMatch(item, searchTerm));
	const otherLocal = localRooms.filter((item) => !isExactSearchMatch(item, searchTerm));

	const exactServer = fromServer.filter((item) => isExactSearchMatch(item, searchTerm));
	const otherServer = fromServer.filter((item) => !isExactSearchMatch(item, searchTerm));

	return Array.from(new Set([...exactLocal, ...exactServer, ...otherLocal, ...otherServer]));
};

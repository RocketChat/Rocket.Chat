export const parseUriList = (userUri: string): string[] =>
	userUri
		.split(/[,\n]/)
		.map((uri) => uri.trim())
		.filter((uri) => uri !== '');

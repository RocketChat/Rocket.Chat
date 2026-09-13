const replaceControlCharacters = (value: string): string =>
	Array.from(value, (character) => {
		const codePoint = character.codePointAt(0) ?? 0;
		return codePoint < 0x20 || codePoint === 0x7f ? '_' : character;
	}).join('');

const encodeRFC5987Value = (value: string): string =>
	encodeURIComponent(value).replace(/['()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);

export const getContentDisposition = (disposition: 'inline' | 'attachment', fileName: string): string => {
	const safeFileName = replaceControlCharacters(fileName);
	const asciiFileName = safeFileName.replace(/[^\x20-\x7E]/g, '_');
	const quotedFileName = asciiFileName.replace(/["\\]/g, (character) => `\\${character}`);
	const fallback = `${disposition}; filename="${quotedFileName}"`;

	if (asciiFileName === safeFileName) {
		return fallback;
	}

	return `${fallback}; filename*=UTF-8''${encodeRFC5987Value(safeFileName)}`;
};

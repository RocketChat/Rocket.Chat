// Inline Markdown markers end at a line break, so a multi-line selection takes them on each line
const INLINE_MARKERS = ['*', '_', '~', '`'];

export const getLineMarker = (pattern: string): string | undefined => {
	const [start, end] = pattern.split('{{text}}');
	return start === end && INLINE_MARKERS.includes(start) ? start : undefined;
};

const LINE_PARTS = /^(\s*)([\s\S]*?)(\s*)$/;

const isWrapped = (line: string, marker: string): boolean => {
	if (line.length <= marker.length * 2 || !line.startsWith(marker) || !line.endsWith(marker)) {
		return false;
	}

	// Emphasis around nothing but whitespace is plain text, unlike a code span
	return marker === '`' || line.slice(marker.length, -marker.length).trim() !== '';
};

export const isEachLineWrapped = (text: string, marker: string): boolean => {
	const filled = text
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line !== '');

	return filled.length > 0 && filled.every((line) => isWrapped(line, marker));
};

export const toggleLineMarker = (text: string, marker: string): string => {
	const removing = isEachLineWrapped(text, marker);

	return text
		.split('\n')
		.map((line) => {
			if (line.trim() === '') {
				return line;
			}

			const [, leading = '', content = '', trailing = ''] = LINE_PARTS.exec(line) ?? [];
			const toggled = removing ? content.slice(marker.length, -marker.length) : `${marker}${content}${marker}`;

			return `${leading}${toggled}${trailing}`;
		})
		.join('\n');
};

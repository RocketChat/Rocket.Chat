// Inline Markdown markers end at a line break, so a multi-line selection takes them on each line
const INLINE_MARKERS = ['*', '_', '~', '`'];

export const getLineMarker = (pattern: string): string | undefined => {
	const [start, end] = pattern.split('{{text}}');
	return start === end && INLINE_MARKERS.includes(start) ? start : undefined;
};

const LINE_PARTS = /^(\s*)(.*?)(\s*)$/;

const isWrapped = (line: string, marker: string): boolean =>
	line.length > marker.length * 2 && line.startsWith(marker) && line.endsWith(marker);

export const toggleLineMarker = (text: string, marker: string): string => {
	const lines = text.split('\n');
	const filled = lines.filter((line) => line.trim() !== '').map((line) => line.trim());
	const removing = filled.length > 0 && filled.every((line) => isWrapped(line, marker));

	return lines
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

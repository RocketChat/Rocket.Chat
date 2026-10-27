export type SearchSnippetPart = { text: string; marked: boolean };

const ENTITIES: Record<string, string> = {
	'&amp;': '&',
	'&lt;': '<',
	'&gt;': '>',
	'&quot;': '"',
	'&#39;': "'",
};

const decodeEntities = (text: string): string => text.replace(/&(?:amp|lt|gt|quot|#39);/g, (entity) => ENTITIES[entity]);

/**
 * Splits a search hit snippet (escaped message text with `<mark>` tags) into text parts. Only `<mark>` and `</mark>`
 * become highlights. Every other tag stays text, so the page renders the parts as text and never parses the snippet as
 * HTML. The snippet is text written by other users.
 */
export const parseSearchSnippet = (snippet: string): SearchSnippetPart[] => {
	const parts: SearchSnippetPart[] = [];
	let marked = false;

	for (const piece of snippet.split(/(<\/?mark>)/)) {
		if (piece === '<mark>') {
			marked = true;
			continue;
		}
		if (piece === '</mark>') {
			marked = false;
			continue;
		}
		if (!piece) continue;

		const text = decodeEntities(piece);
		const previous = parts[parts.length - 1];
		if (previous?.marked === marked) previous.text += text;
		else parts.push({ text, marked });
	}

	return parts;
};

/**
 * Splits the snippet parts into lines. The indexed body puts the message text and each file name on their own line
 * (`toSearchDoc`), and a hit shows them on separate lines, as the server search result does. Empty lines are dropped.
 */
export const parseSearchSnippetLines = (snippet: string): SearchSnippetPart[][] => {
	const lines: SearchSnippetPart[][] = [[]];

	for (const part of parseSearchSnippet(snippet)) {
		part.text.split(/\r?\n/).forEach((text, index) => {
			if (index > 0) lines.push([]);
			if (text) lines[lines.length - 1].push({ text, marked: part.marked });
		});
	}

	return lines.filter((line) => line.some(({ text }) => text.trim()));
};

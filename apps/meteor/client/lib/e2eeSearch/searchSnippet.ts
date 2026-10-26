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

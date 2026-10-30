import { Fragment } from 'react';

export type SearchSnippetTextProps = { snippet: string };

type SnippetPart = { text: string; marked: boolean };

const entities: Record<string, string> = {
	'&amp;': '&',
	'&lt;': '<',
	'&gt;': '>',
	'&quot;': '"',
	'&#39;': "'",
};

const parseLines = (snippet: string): SnippetPart[][] => {
	const lines: SnippetPart[][] = [[]];
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

		const text = piece.replace(/&(?:amp|lt|gt|quot|#39);/g, (entity) => entities[entity]);
		for (const [index, lineText] of text.split(/\r?\n/).entries()) {
			if (index > 0) lines.push([]);
			if (!lineText) continue;
			const line = lines[lines.length - 1];
			const previous = line[line.length - 1];
			if (previous?.marked === marked) previous.text += lineText;
			else line.push({ text: lineText, marked });
		}
	}

	return lines.filter((line) => line.some(({ text }) => text.trim()));
};

/** Shows highlights without interpreting message text as HTML. */
const SearchSnippetText = ({ snippet }: SearchSnippetTextProps) => (
	<>
		{parseLines(snippet).map((line, lineIndex) => (
			<div key={lineIndex}>
				{line.map((part, index) => (part.marked ? <mark key={index}>{part.text}</mark> : <Fragment key={index}>{part.text}</Fragment>))}
			</div>
		))}
	</>
);

export default SearchSnippetText;

import { parseSearchSnippetLines } from '../../../../../lib/e2eeSearch/searchSnippet';

// The snippet is text written by other users: it is rendered as text parts, never as HTML. A plain <mark> matches the
// highlight of the server search results (gazzodown). Each line is a block, so the caption and the file name of a file
// hit are on separate lines, as in the server result.
const SearchSnippetText = ({ snippet }: { snippet: string }) => (
	<>
		{parseSearchSnippetLines(snippet).map((line, lineIndex) => (
			<div key={lineIndex}>
				{line.map((part, index) => (part.marked ? <mark key={index}>{part.text}</mark> : <span key={index}>{part.text}</span>))}
			</div>
		))}
	</>
);

export default SearchSnippetText;

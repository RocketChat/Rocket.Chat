import { parseSearchSnippet } from '../../../../../lib/e2eeSearch/searchSnippet';

// The snippet is text written by other users: it is rendered as text parts, never as HTML. A plain <mark> matches the
// highlight of the server search results (gazzodown).
const SearchSnippetText = ({ snippet }: { snippet: string }) => (
	<>
		{parseSearchSnippet(snippet).map((part, index) =>
			part.marked ? <mark key={index}>{part.text}</mark> : <span key={index}>{part.text}</span>,
		)}
	</>
);

export default SearchSnippetText;

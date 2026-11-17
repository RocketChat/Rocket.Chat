import { Text } from '@rocket.chat/fuselage';
import { Fragment } from 'react';

import { parseSearchSnippetLines } from '../../../../../lib/e2eeSearch/searchSnippet';

// The snippet is text written by other users: it is rendered as text parts, never as HTML. A plain <mark> matches the
// highlight of the server search results (gazzodown). Each line is a block, so the caption and the file name of a file
// hit are on separate lines, as in the server result.
const SearchSnippetText = ({ snippet }: { snippet: string }) => (
	<>
		{parseSearchSnippetLines(snippet).map((line, lineIndex) => (
			<Text is='div' key={lineIndex}>
				{line.map((part, index) => (part.marked ? <mark key={index}>{part.text}</mark> : <Fragment key={index}>{part.text}</Fragment>))}
			</Text>
		))}
	</>
);

export default SearchSnippetText;

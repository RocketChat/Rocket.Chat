import { Text } from '@rocket.chat/fuselage';
import { Fragment } from 'react';

import { parseSearchSnippetLines } from '../../../../../lib/e2eeSearch/searchSnippet';

// The snippet is text written by other users: it is rendered as text parts, never as HTML.
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

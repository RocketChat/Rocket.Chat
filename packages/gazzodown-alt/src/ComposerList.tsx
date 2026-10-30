import type * as MessageParser from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';

import ComposerInlineElements from './ComposerInlineElements.js';
import ComposerPlainSpan from './ComposerPlainSpan.js';
import { nestedSourceOf } from './sourceLines.js';

type ComposerListProps = {
	items: MessageParser.ListItem[];
	marker: (item: MessageParser.ListItem) => string;
	lines: string[];
};

// Nested lists are reprinted as their unstyled source.
const ComposerList = ({ items, marker, lines }: ComposerListProps): ReactElement => {
	const nested = nestedSourceOf(items, lines);

	return (
		<span>
			{items.map((item, index) => (
				<span key={index}>
					<span style={listMarkerStyle}>{marker(item)}</span>
					<ComposerInlineElements>{item.value}</ComposerInlineElements>
					{'\n'}
					<ComposerPlainSpan text={nested[index]} />
				</span>
			))}
		</span>
	);
};

const listMarkerStyle: React.CSSProperties = {
	fontWeight: 700,
	paddingInlineStart: '0.5rem',
};

export default ComposerList;

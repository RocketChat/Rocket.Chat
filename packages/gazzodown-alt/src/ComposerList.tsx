import type * as MessageParser from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';

import ComposerInlineElements from './ComposerInlineElements';

type ComposerListProps = {
	items: MessageParser.ListItem[];
	marker: (item: MessageParser.ListItem) => string;
	depth?: number;
};

const nestedMarker = (item: MessageParser.ListItem): string => (item.number !== undefined ? `${item.number}. ` : '- ');

const ComposerList = ({ items, marker, depth = 0 }: ComposerListProps): ReactElement => (
	<span>
		{items.map((item, index) => (
			<span key={index}>
				<span style={{ ...listMarkerStyle, paddingInlineStart: `${0.5 + depth * 1.5}rem` }}>{marker(item)}</span>
				<ComposerInlineElements>{item.value}</ComposerInlineElements>
				{'\n'}
				{item.children?.length ? <ComposerList items={item.children} marker={nestedMarker} depth={depth + 1} /> : null}
			</span>
		))}
	</span>
);

const listMarkerStyle: React.CSSProperties = {
	fontWeight: 700,
	paddingInlineStart: '0.5rem',
};

export default ComposerList;

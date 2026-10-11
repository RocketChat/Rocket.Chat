import type * as MessageParser from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';

import ComposerInlineElements from './ComposerInlineElements';

type ComposerListProps = {
	items: MessageParser.ListItem[];
	marker: (item: MessageParser.ListItem) => string;
};

const ComposerList = ({ items, marker }: ComposerListProps): ReactElement => (
	<span>
		{items.map((item, index) => (
			<span key={index}>
				<span style={listMarkerStyle}>{marker(item)}</span>
				<ComposerInlineElements>{item.value}</ComposerInlineElements>
				{'\n'}
			</span>
		))}
	</span>
);

const listMarkerStyle: React.CSSProperties = {
	fontWeight: 700,
	paddingInlineStart: '0.5rem',
};

export default ComposerList;

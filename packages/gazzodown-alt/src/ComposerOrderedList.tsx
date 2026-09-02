import type * as MessageParser from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';

import ComposerInlineElements from './ComposerInlineElements';
import { listMarkerStyle } from './listMarkerStyle';

type ComposerOrderedListProps = {
	items: MessageParser.ListItem[];
};

const ComposerOrderedList = ({ items }: ComposerOrderedListProps): ReactElement => (
	<span>
		{items.map((item, index) => (
			<span key={index}>
				<span style={listMarkerStyle}>{`${item.number}. `}</span>
				<ComposerInlineElements>{item.value}</ComposerInlineElements>
				{'\n'}
			</span>
		))}
	</span>
);

export default ComposerOrderedList;

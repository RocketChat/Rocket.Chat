import type * as MessageParser from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';

import ComposerInlineElements from './ComposerInlineElements';

type ComposerUnorderedListProps = {
	items: MessageParser.ListItem[];
};

const markerStyle = {
	fontWeight: 700,
	paddingInlineStart: '0.5rem',
} as const;

const ComposerUnorderedList = ({ items }: ComposerUnorderedListProps): ReactElement => (
	<span>
		{items.map((item, index) => (
			<span key={index}>
				<span style={markerStyle}>{'- '}</span>
				<ComposerInlineElements>{item.value}</ComposerInlineElements>
				{'\n'}
			</span>
		))}
	</span>
);

export default ComposerUnorderedList;

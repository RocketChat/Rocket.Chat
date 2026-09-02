import type * as MessageParser from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';

import ComposerInlineElements from './ComposerInlineElements';
import { listMarkerStyle } from './listMarkerStyle';

type ComposerUnorderedListProps = {
	items: MessageParser.ListItem[];
};

const ComposerUnorderedList = ({ items }: ComposerUnorderedListProps): ReactElement => (
	<span>
		{items.map((item, index) => (
			<span key={index}>
				<span style={listMarkerStyle}>{'- '}</span>
				<ComposerInlineElements>{item.value}</ComposerInlineElements>
				{'\n'}
			</span>
		))}
	</span>
);

export default ComposerUnorderedList;

import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import type * as MessageParser from '@rocket.chat/message-parser';

import Markup from '../Markup';

// The message body strips list indentation and gives every `ul li` a bullet, so nested lists win both back here.
const nestedListsStyle = css`
	padding-inline-start: 1.25rem;

	&& > ul,
	&& > ol {
		padding-block: 0;
	}

	&& ol > li::before {
		content: attr(value) '.';
	}
`;

type NestedListsBlockProps = {
	lists: MessageParser.NestedList[];
};

const NestedListsBlock = ({ lists }: NestedListsBlockProps) => (
	<Box className={nestedListsStyle}>
		<Markup tokens={lists} />
	</Box>
);

export default NestedListsBlock;

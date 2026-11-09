import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type AbacAttributeTagsProps = {
	/** The attribute has no value set, so the list only holds the tag that says so. */
	empty?: boolean;
	children: ReactNode;
};

/**
 * An attribute's values as tags that wrap onto as many lines as they need.
 */
const AbacAttributeTags = ({ empty, children }: AbacAttributeTagsProps) => (
	<Box display='flex' flexWrap='wrap' gap='x4' paddingInlineEnd={empty ? undefined : 'x4'} paddingBlockEnd={empty ? undefined : 'x4'}>
		{children}
	</Box>
);

export default AbacAttributeTags;

import { Box } from '@rocket.chat/fuselage';
import type { AriaRole, ReactNode, Ref } from 'react';

export type ContextualbarListAreaProps = {
	'id'?: string;
	'ref'?: Ref<HTMLElement>;
	'role'?: AriaRole;
	'aria-label'?: string;
	'children': ReactNode;
};

/**
 * The area a contextual bar's virtualized list fills: the rest of the content's height, clipped so the list scrolls
 * inside it.
 */
const ContextualbarListArea = (props: ContextualbarListAreaProps) => (
	<Box width='full' height='full' overflow='hidden' flexShrink={1} {...props} />
);

export default ContextualbarListArea;

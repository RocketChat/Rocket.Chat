import { Box } from '@rocket.chat/fuselage';
import type { AriaRole, ReactNode, Ref } from 'react';

export type ListViewportProps = {
	'id'?: string;
	'ref'?: Ref<HTMLElement>;
	'role'?: AriaRole;
	'aria-label'?: string;
	'children'?: ReactNode;
};

/**
 * The clipped area a list fills, taking the space its panel leaves, so a virtualized list scrolls inside it.
 */
const ListViewport = ({ id, ref, role, 'aria-label': ariaLabel, children }: ListViewportProps) => (
	<Box
		id={id}
		ref={ref}
		role={role}
		aria-label={ariaLabel}
		width='full'
		height='full'
		flexGrow={1}
		flexShrink={1}
		flexBasis='0'
		overflow='hidden'
	>
		{children}
	</Box>
);

export default ListViewport;

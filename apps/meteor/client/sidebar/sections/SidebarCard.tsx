import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type SidebarCardProps = {
	/** An `Item`, whose own padding the body is inset to match. */
	header: ReactNode;
	children: ReactNode;
};

/**
 * Reusable elevated surface for sidebar sections: a padded, rounded, subtly
 * bordered container in the sidebar tint.
 */
const SidebarCard = ({ header, children }: SidebarCardProps) => (
	<Box
		display='flex'
		flexDirection='column'
		gap='x4'
		margin={8}
		padding='x4'
		borderRadius='large'
		borderWidth='default'
		borderStyle='solid'
		borderColor='stroke-light'
		backgroundColor='surface-tint'
	>
		{header}
		<Box padding='x4'>{children}</Box>
	</Box>
);

export default SidebarCard;

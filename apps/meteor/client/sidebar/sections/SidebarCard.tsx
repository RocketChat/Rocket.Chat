import { Box } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

type SidebarCardProps = ComponentPropsWithoutRef<typeof Box> & { children: ReactNode };

/**
 * Reusable elevated surface for sidebar sections: a padded, rounded, subtly
 * bordered container in the sidebar tint. Spread extra Box props to tweak it.
 */
const SidebarCard = ({ children, ...props }: SidebarCardProps) => (
	<Box
		m={8}
		p={10}
		borderRadius={8}
		backgroundColor='surface-tint'
		style={{ border: '1px solid var(--rcx-color-stroke-light)' }}
		{...props}
	>
		{children}
	</Box>
);

export default SidebarCard;

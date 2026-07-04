import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type SidebarCardProps = { children: ReactNode };

/**
 * Reusable elevated surface for sidebar sections: a padded, rounded, subtly
 * bordered container in the sidebar tint.
 */
const SidebarCard = ({ children }: SidebarCardProps) => (
	<Box m={8} p={10} borderRadius='x8' borderWidth='default' borderStyle='solid' borderColor='stroke-light' backgroundColor='surface-tint'>
		{children}
	</Box>
);

export default SidebarCard;

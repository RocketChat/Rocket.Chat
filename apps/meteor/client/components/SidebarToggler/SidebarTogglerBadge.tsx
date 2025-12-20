import { css } from '@rocket.chat/css-in-js';
import { Box, Badge } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type SidebarTogglerBadgeProps = {
	children?: ReactNode;
};

const SidebarTogglerBadge = ({ children }: SidebarTogglerBadgeProps) => (
	<Box
		className={css`
			position: absolute;
			z-index: 3;
			top: -5px;
			right: -5px;
		`}
	>
		<Badge variant='danger'>{children}</Badge>
	</Box>
);

export default SidebarTogglerBadge;

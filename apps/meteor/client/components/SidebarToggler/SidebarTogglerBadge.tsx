import { css } from '@rocket.chat/css-in-js';
import { Box, Badge } from '@rocket.chat/fuselage';

const SidebarTogglerBadge = ({ children }: { children?: unknown }) => (
	<Box
		className={css`
			position: absolute;
			z-index: 3;
			top: -5px;
			right: 3px;
		`}
	>
		<Badge variant='danger' children={children} />
	</Box>
);

export default SidebarTogglerBadge;

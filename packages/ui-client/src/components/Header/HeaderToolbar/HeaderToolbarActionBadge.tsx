import { css } from '@rocket.chat/css-in-js';
import { Box, Badge } from '@rocket.chat/fuselage';
import type { ComponentProps, FC } from 'react';

const HeaderToolbarActionActionBadge: FC<ComponentProps<typeof Badge>> = (props) => (
	<Box
		position='absolute'
		role='status'
		className={css`
			top: 0;
			right: 0;
			transform: translate(30%, -30%);
			z-index: 1;
		`}
	>
		<Badge {...props} />
	</Box>
);

export default HeaderToolbarActionActionBadge;

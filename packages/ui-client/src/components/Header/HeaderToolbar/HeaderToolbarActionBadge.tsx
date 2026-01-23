import { css } from '@rocket.chat/css-in-js';
import { Box, Badge } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

type HeaderToolbarActionBadgeProps = ComponentPropsWithoutRef<typeof Badge>;

const HeaderToolbarActionBadge = (props: HeaderToolbarActionBadgeProps) => (
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

export default HeaderToolbarActionBadge;

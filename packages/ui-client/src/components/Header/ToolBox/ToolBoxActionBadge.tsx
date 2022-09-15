import { css } from '@rocket.chat/css-in-js';
import { Box, Badge } from '@rocket.chat/fuselage';
import type { ComponentProps, FC } from 'react';
import React from 'react';

const ToolBoxActionBadge: FC<ComponentProps<typeof Badge>> = (props) => (
	<Box
		position='absolute'
		className={css`
			top: 0;
			right: 0;
			transform: translate(30%, -30%);
		`}
	>
		<Badge {...props} />
	</Box>
);

export default ToolBoxActionBadge;

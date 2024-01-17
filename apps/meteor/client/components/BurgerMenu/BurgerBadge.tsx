import { css } from '@rocket.chat/css-in-js';
import { Box, Badge } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';

const BurgerBadge = ({ children }: { children?: unknown }): ReactElement => (
	<Box
		className={css`
			position: absolute;
			zindex: 3;
			top: -5px;
			right: -5px;
		`}
	>
		<Badge variant='danger' children={children} />
	</Box>
);

export default BurgerBadge;

import React, { FC } from 'react';
import { Box, Badge, BadgeProps } from '@rocket.chat/fuselage';
import { css } from '@rocket.chat/css-in-js';

type HeaderToolBoxActionBadgeProps = BadgeProps;

const HeaderToolBoxActionBadge: FC<HeaderToolBoxActionBadgeProps> = (props) => (
	<Box className={css`position: absolute; top: 0; right: 0; transform: translate(30%, -30%);`}>
		<Badge {...props}/>
	</Box>
);

export default HeaderToolBoxActionBadge;

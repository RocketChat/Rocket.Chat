import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import React from 'react';

export const InlineGroup: FC<{ gap: number }> = ({ children, gap }) => {
	const badgesContainer = css`
		* + * {
			margin-inline-start: ${gap}px;
		}
	`;

	return <Box className={badgesContainer}>{children}</Box>;
};

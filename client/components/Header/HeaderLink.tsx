import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors';
import React, { ComponentProps, FC } from 'react';

const HeaderLink: FC<ComponentProps<typeof Box>> = (props) => (
	<Box
		is='a'
		{...props}
		className={[
			css`
				&:hover,
				&:focus {
					color: ${colors.n800} !important;
				}
				&:visited {
					color: ${colors.n800};
				}
			`,
		].filter(Boolean)}
	/>
);

export default HeaderLink;

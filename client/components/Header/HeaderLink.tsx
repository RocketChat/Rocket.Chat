import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors';
import React, { ComponentProps, FC } from 'react';

const HeaderLink: FC<ComponentProps<typeof Box>> = (props) => (
	<Box
		is='a'
		{...props}
		withTruncatedText
		className={[
			css`
				color: ${colors.n700} !important;
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

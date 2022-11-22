import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import type { ComponentProps, FC } from 'react';
import React from 'react';

const HeaderLink: FC<ComponentProps<typeof Box>> = (props) => (
	<Box
		is='a'
		{...props}
		withTruncatedText
		className={[
			css`
				color: ${Palette.text['font-hint']} !important;
				display: flex;
				&:hover,
				&:focus {
					color: ${Palette.text['font-default']} !important;
				}
				&:visited {
					color: ${Palette.text['font-default']};
				}
			`,
		]}
	/>
);

export default HeaderLink;

import { Box, BoxProps } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

type HeaderSubtitleProps = BoxProps;

const HeaderSubtitle: FC<HeaderSubtitleProps> = (props) => (
	<Box
		color='hint'
		fontScale='p1'
		withTruncatedText
		{...props}
	/>
);

export default HeaderSubtitle;

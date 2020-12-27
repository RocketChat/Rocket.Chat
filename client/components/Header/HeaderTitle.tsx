import { Box, BoxProps } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

type HeaderTitleProps = BoxProps;

const HeaderTitle: FC<HeaderTitleProps> = (props) => <Box
	color='default'
	mi='x4'
	fontScale='s2'
	withTruncatedText
	{...props}
/>;

export default HeaderTitle;

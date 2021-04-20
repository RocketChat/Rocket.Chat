import { Box, Icon } from '@rocket.chat/fuselage';
import React, { FC, ReactNode } from 'react';

type TitleProps = {
	title: string;
	icon: string | ReactNode;
};

const Title: FC<TitleProps> = ({ title, icon }) => (
	<Box
		display='flex'
		title={title}
		flexShrink={0}
		alignItems='center'
		fontScale='s2'
		color='default'
		withTruncatedText
	>
		{typeof icon === 'string' ? <Icon name={icon} size='x22' /> : icon}
		<Box mis='x8' flexGrow={1} withTruncatedText>
			{title}
		</Box>
	</Box>
);

export default Title;

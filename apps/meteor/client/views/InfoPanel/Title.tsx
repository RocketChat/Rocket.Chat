import { Box, Icon } from '@rocket.chat/fuselage';
import React, { ComponentProps, FC, ReactNode } from 'react';

type TitleProps = {
	title: string;
	icon: ComponentProps<typeof Icon>['name'] | Exclude<ReactNode, string | {}>;
};

const Title: FC<TitleProps> = ({ title, icon }) => (
	<Box display='flex' title={title} flexShrink={0} alignItems='center' fontScale='h4' color='default' withTruncatedText>
		{typeof icon === 'string' ? icon && <Icon name={icon} size='x22' /> : icon}
		<Box mis='x8' flexGrow={1} withTruncatedText>
			{title}
		</Box>
	</Box>
);

export default Title;

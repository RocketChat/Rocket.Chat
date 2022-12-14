import { Box, Icon } from '@rocket.chat/fuselage';
import type { ComponentProps, FC, ReactNode } from 'react';
import React from 'react';

type InfoPanelTitleProps = {
	title: string;
	icon: ReactNode;
};

const isValidIcon = (icon: ReactNode): icon is ComponentProps<typeof Icon>['name'] => typeof icon === 'string';

const InfoPanelTitle: FC<InfoPanelTitleProps> = ({ title, icon }) => (
	<Box display='flex' title={title} flexShrink={0} alignItems='center' fontScale='h4' color='default' withTruncatedText>
		{isValidIcon(icon) ? <Icon name={icon} size='x22' /> : icon}
		<Box mis='x8' flexGrow={1} withTruncatedText>
			{title}
		</Box>
	</Box>
);

export default InfoPanelTitle;

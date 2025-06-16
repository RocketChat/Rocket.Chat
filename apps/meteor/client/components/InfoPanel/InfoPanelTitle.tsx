import { Box, Icon } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { ReactNode } from 'react';

type InfoPanelTitleProps = {
	title: string;
	icon: ReactNode;
};

const isValidIcon = (icon: ReactNode): icon is IconName => typeof icon === 'string';

const InfoPanelTitle = ({ title, icon }: InfoPanelTitleProps) => (
	<Box display='flex' flexShrink={0} alignItems='center' fontScale='h4' color='default' withTruncatedText>
		{isValidIcon(icon) ? <Icon name={icon} size='x22' /> : icon}
		<Box mis={8} withTruncatedText title={title}>
			{title}
		</Box>
	</Box>
);

export default InfoPanelTitle;

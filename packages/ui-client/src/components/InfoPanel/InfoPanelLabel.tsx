import { Box, Icon } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

type InfoPanelLabelProps = ComponentPropsWithoutRef<typeof Box>;

const InfoPanelLabel = ({ title, children, ...props }: InfoPanelLabelProps) => (
	<Box mb={8} fontScale='p2m' color='default' {...props}>
		{children}
		{title && <Icon name='info' color='font-secondary-info' mi={4} size='x16' title={title} />}
	</Box>
);

export default InfoPanelLabel;

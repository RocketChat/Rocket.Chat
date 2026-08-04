import { Box, Icon } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

export type InfoPanelLabelProps = ComponentPropsWithoutRef<typeof Box>;

const InfoPanelLabel = ({ title, children, ...props }: InfoPanelLabelProps) => (
	<Box marginBlock={8} fontScale='p2m' color='default' {...props}>
		{children}
		{title && <Icon name='info' color='secondary-info' marginInline={4} size='x16' title={title} />}
	</Box>
);

export default InfoPanelLabel;

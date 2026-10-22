import { Box, StatusIcon } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

export type InfoPanelLabelProps = ComponentPropsWithoutRef<typeof Box>;

const InfoPanelLabel = ({ title, children, ...props }: InfoPanelLabelProps) => (
	<Box marginBlock={8} fontScale='p2m' color='default' display='flex' alignItems='center' columnGap={4} {...props}>
		{children}
		{title && <StatusIcon name='info' status='hint' size='x16' title={title} />}
	</Box>
);

export default InfoPanelLabel;

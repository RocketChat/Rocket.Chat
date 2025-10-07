import { Box, Icon, Palette } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

type InfoPanelLabelProps = ComponentPropsWithoutRef<typeof Box>;

const InfoPanelLabel = (props: InfoPanelLabelProps) => {
	const { title, children, ...filteredProps } = props;
	return (
		<Box mb={8} fontScale='p2m' color='default' {...filteredProps}>
			{children}
			{title && <Icon name='info' color={Palette.statusColor['status-font-on-info']} mi={4} size='x16' title={title} />}
		</Box>
	);
};

export default InfoPanelLabel;

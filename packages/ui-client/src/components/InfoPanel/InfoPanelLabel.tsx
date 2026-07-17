import { Box, Icon } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactNode } from 'react';

export type InfoPanelLabelProps = {
	children?: ReactNode;
	title?: string;
	id?: string;
} & Pick<ComponentProps<typeof Box>, 'is'>;

const InfoPanelLabel = ({ title, children, is, id }: InfoPanelLabelProps) => (
	<Box is={is} id={id} marginBlock={8} fontScale='p2m' color='default'>
		{children}
		{title && <Icon name='info' color='secondary-info' marginInline={4} size='x16' title={title} />}
	</Box>
);

export default InfoPanelLabel;

import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactNode } from 'react';

export type InfoPanelFieldProps = {
	children?: ReactNode;
} & Pick<ComponentProps<typeof Box>, 'is'>;

const InfoPanelField = ({ children, is }: InfoPanelFieldProps) => (
	<Box is={is} marginBlock={16}>
		{children}
	</Box>
);

export default InfoPanelField;

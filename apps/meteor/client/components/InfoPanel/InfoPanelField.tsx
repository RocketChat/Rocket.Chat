import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type InfoPanelFieldProps = {
	children?: ReactNode;
};

const InfoPanelField = ({ children }: InfoPanelFieldProps) => <Box mb={16}>{children}</Box>;

export default InfoPanelField;

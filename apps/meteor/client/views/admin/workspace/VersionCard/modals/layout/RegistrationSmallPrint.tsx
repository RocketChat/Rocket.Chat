import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type RegistrationSmallPrintProps = {
	children: ReactNode;
};

/**
 * Small print in a registration modal: set in the caption size, it keeps the line height of the text around it.
 */
const RegistrationSmallPrint = ({ children }: RegistrationSmallPrintProps) => <Box fontSize='c1'>{children}</Box>;

export default RegistrationSmallPrint;

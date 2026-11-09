import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type ModalCalloutContentProps = {
	children: ReactNode;
};

/**
 * A callout that is a modal's whole content, kept clear of the modal's header.
 */
const ModalCalloutContent = ({ children }: ModalCalloutContentProps) => <Box paddingBlockStart='x16'>{children}</Box>;

export default ModalCalloutContent;

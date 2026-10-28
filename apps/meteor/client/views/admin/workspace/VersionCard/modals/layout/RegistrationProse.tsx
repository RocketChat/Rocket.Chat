import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type RegistrationProseProps = {
	children: ReactNode;
};

/**
 * The explanatory text of a registration modal, its paragraphs and lists spaced as rich text.
 */
const RegistrationProse = ({ children }: RegistrationProseProps) => <Box withRichContent>{children}</Box>;

export default RegistrationProse;

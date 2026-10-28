import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type ContextualbarInsetProps = {
	children: ReactNode;
};

/**
 * Content shown alone in a flush contextual bar body, inset by the body's padding on every side.
 */
const ContextualbarInset = ({ children }: ContextualbarInsetProps) => <Box padding='x24'>{children}</Box>;

export default ContextualbarInset;

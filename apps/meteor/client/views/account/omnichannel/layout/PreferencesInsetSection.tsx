import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type PreferencesInsetSectionProps = {
	children: ReactNode;
};

/**
 * A group of preferences shown above the accordion, inset to line up with the accordion items' content.
 */
const PreferencesInsetSection = ({ children }: PreferencesInsetSectionProps) => <Box paddingInline='x8'>{children}</Box>;

export default PreferencesInsetSection;

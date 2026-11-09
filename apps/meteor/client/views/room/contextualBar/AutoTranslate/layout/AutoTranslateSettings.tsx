import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type AutoTranslateSettingsProps = {
	children: ReactNode;
};

/**
 * The auto-translation settings, set 24px below the panel's header.
 */
const AutoTranslateSettings = ({ children }: AutoTranslateSettingsProps) => <Box paddingBlockStart='x24'>{children}</Box>;

export default AutoTranslateSettings;

import { Stack, Text } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type SecuritySectionProps = {
	title: string;
	headingLevel?: 'h3' | 'h4';
	/** Keeps a lone action at its own width instead of stretching it across the section. */
	compact?: boolean;
	children: ReactNode;
};

/**
 * A security setting: its heading, then the text, fields or action that change it.
 */
const SecuritySection = ({ title, headingLevel = 'h3', compact, children }: SecuritySectionProps) => (
	<Stack align={compact ? 'start' : undefined} gap='x12'>
		<Text is={headingLevel} fontScale='h4'>
			{title}
		</Text>
		{children}
	</Stack>
);

export default SecuritySection;

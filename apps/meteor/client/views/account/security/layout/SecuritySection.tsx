import { Stack, Text } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type SecuritySectionProps = {
	title: ReactNode;
	headingLevel: 'h3' | 'h4';
	fitContent?: boolean;
	children: ReactNode;
};

/**
 * A titled block of a settings page: the heading, then its content.
 */
const SecuritySection = ({ title, headingLevel, fitContent = false, children }: SecuritySectionProps) => (
	<Stack align={fitContent ? 'start' : undefined} gap='x12'>
		<Text is={headingLevel} fontScale='h4'>
			{title}
		</Text>
		{children}
	</Stack>
);

export default SecuritySection;

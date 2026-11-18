import { Stack } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type AppInfoSectionProps = {
	title: ReactNode;
	children: ReactNode;
};

/**
 * One section of an app details tab: its title, then its content.
 */
const AppInfoSection = ({ title, children }: AppInfoSectionProps) => (
	<Stack is='section' gap='x8'>
		{title}
		{children}
	</Stack>
);

export default AppInfoSection;

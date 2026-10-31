import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type ResetPassphraseSectionProps = {
	title: string;
	description: string;
	children: ReactNode;
};

const ResetPassphraseSection = ({ title, description, children }: ResetPassphraseSectionProps) => (
	<Box display='flex' flexDirection='column' gap='x12'>
		<Box is='h4' fontScale='h4'>
			{title}
		</Box>
		<Box is='p' fontScale='p1'>
			{description}
		</Box>
		{children}
	</Box>
);

export default ResetPassphraseSection;

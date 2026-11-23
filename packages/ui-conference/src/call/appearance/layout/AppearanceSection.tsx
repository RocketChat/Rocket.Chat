import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type AppearanceSectionProps = { title: string; children: ReactNode };

const AppearanceSection = ({ title, children }: AppearanceSectionProps) => (
	<Box is='section' marginBlockStart='x24'>
		<Box is='h3' fontScale='h5' marginBlockEnd='x8'>
			{title}
		</Box>
		{children}
	</Box>
);

export default AppearanceSection;

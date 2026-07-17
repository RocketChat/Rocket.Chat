import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type HeaderTitleProps = { children?: ReactNode };

const HeaderTitle = ({ children }: HeaderTitleProps) => (
	<Box color='titles-labels' marginInline={4} is='h1' fontScale='h4' withTruncatedText>
		{children}
	</Box>
);

export default HeaderTitle;

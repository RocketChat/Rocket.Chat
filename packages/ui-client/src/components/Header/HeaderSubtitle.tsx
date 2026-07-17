import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type HeaderSubtitleProps = { children?: ReactNode };

const HeaderSubtitle = ({ children }: HeaderSubtitleProps) => (
	<Box color='hint' fontScale='p2' paddingBlock='x4' flexGrow={1} withTruncatedText>
		{children}
	</Box>
);

export default HeaderSubtitle;

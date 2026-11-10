import { css } from '@rocket.chat/css-in-js';
import { Box, ItemGroup } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

// Item pads its row by 4px; pull the list back so icons line up with the avatar above.
const alignWithContent = css`
	margin-inline: -0.25rem;
`;

export type HoverCardInfoListProps = { children: ReactNode };

const HoverCardInfoList = ({ children }: HoverCardInfoListProps) => (
	<Box className={alignWithContent}>
		<ItemGroup is='ul'>{children}</ItemGroup>
	</Box>
);

export default HoverCardInfoList;

import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

const sectionLabelStyle = css`
	text-transform: uppercase;
	letter-spacing: 0.03em;
`;

export type RoomHoverCardSectionLabelProps = { children: ReactNode };

const RoomHoverCardSectionLabel = ({ children }: RoomHoverCardSectionLabelProps) => (
	<Box fontScale='micro' color='font-hint' className={sectionLabelStyle}>
		{children}
	</Box>
);

export default RoomHoverCardSectionLabel;

import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

const srOnly = css`
	position: absolute;
	overflow: hidden;
	clip: rect(0 0 0 0);
	width: 1px;
	height: 1px;
	padding: 0;
	border: 0;
	margin: -1px;
	white-space: nowrap;
`;

export type HoverCardBandProps = {
	/** Names what the band lists; shown on hover and announced by screen readers before the content. */
	label?: string;
	children: ReactNode;
};

/** A one-line tinted strip at the top of the card. */
const HoverCardBand = ({ label, children }: HoverCardBandProps) => (
	<Box paddingBlock='x8' paddingInline='x16' backgroundColor='tint' fontScale='c1' color='default' title={label} withTruncatedText>
		{label && <Box is='span' className={srOnly}>{`${label}: `}</Box>}
		{children}
	</Box>
);

export default HoverCardBand;

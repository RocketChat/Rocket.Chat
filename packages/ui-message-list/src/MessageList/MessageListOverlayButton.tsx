import { css } from '@rocket.chat/css-in-js';
import { Box, Bubble } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

const buttonStyle = css`
	position: absolute;
	z-index: 2;
	bottom: 8px;
	left: 50%;
	user-select: none;
	transform: translate(-50%, 0);
	transition:
		transform 0.5s linear,
		visibility 0s;

	&[data-visible='false'] {
		visibility: hidden;
		transform: translate(-50%, 150%);
		transition:
			transform 0.5s linear,
			visibility 0s linear 0.5s;
	}

	@media (prefers-reduced-motion: reduce) {
		transition: none;

		&[data-visible='false'] {
			transition: none;
		}
	}
`;

export type MessageListOverlayButtonProps = {
	isVisible: boolean;
	onClick: () => void;
	children: ReactNode;
};

const MessageListOverlayButton = ({ isVisible, onClick, children }: MessageListOverlayButtonProps) => (
	<Box className={buttonStyle} data-visible={isVisible} aria-hidden={!isVisible}>
		<Bubble icon='arrow-down' onClick={onClick} tabIndex={isVisible ? undefined : -1}>
			{children}
		</Bubble>
	</Box>
);

export default MessageListOverlayButton;

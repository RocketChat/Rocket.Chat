import { css } from '@rocket.chat/css-in-js';
import { Box, Bubble } from '@rocket.chat/fuselage';
import { isTruthy } from '@rocket.chat/tools';

export type JumpToRecentMessageButtonProps = {
	visible: boolean;
	onClick: () => void;
	text: string;
};

const buttonStyle = css`
	position: absolute;
	z-index: 2;
	bottom: 8px;
	left: 50%;
	user-select: none;
	transform: translate(-50%, 0);

	&.not {
		visibility: hidden;
		transform: translate(-50%, 150%);
		transition:
			transform 0.5s linear,
			visibility 0s linear 0.5s;
	}
`;

const JumpToRecentMessageButton = ({ visible, onClick, text }: JumpToRecentMessageButtonProps) => (
	<Box className={[buttonStyle, !visible && 'not'].filter(isTruthy)}>
		<Bubble icon='arrow-down' onClick={onClick}>
			{text}
		</Bubble>
	</Box>
);

export default JumpToRecentMessageButton;

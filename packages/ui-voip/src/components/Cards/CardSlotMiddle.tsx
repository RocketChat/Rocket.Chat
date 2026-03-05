import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type CardSlotMiddleProps = {
	children: ReactNode;
};

const styles = css`
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	z-index: 3;
`;

const CardSlotMiddle = ({ children }: CardSlotMiddleProps) => {
	return (
		<Box is='span' className={styles}>
			{children}
		</Box>
	);
};

export default CardSlotMiddle;

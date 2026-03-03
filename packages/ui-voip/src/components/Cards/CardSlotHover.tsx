import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import { ReactNode } from 'react';

type CardSlotHoverProps = {
	children: ReactNode;
};

const styles = css`
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
`;

const CardSlotHover = ({ children }: CardSlotHoverProps) => {
	return <Box is='span' className={['card-slot-hover', styles]}>
		{children}
	</Box>;
};

export default CardSlotHover;

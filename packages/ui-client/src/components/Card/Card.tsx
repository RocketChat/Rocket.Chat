import { Box } from '@rocket.chat/fuselage';
import type { CSSProperties, FC, ReactNode } from 'react';

type IBackground = {
	backgroundImage?: CSSProperties['backgroundImage'];
	backgroundRepeat?: CSSProperties['backgroundRepeat'];
	backgroundPosition?: CSSProperties['backgroundPosition'];
	backgroundSize?: CSSProperties['backgroundSize'];
};

type CardProps = {
	background?: IBackground;
	children: ReactNode;
};

const Card: FC<CardProps> = ({ background, children, ...props }) => (
	<Box
		borderRadius='x8'
		p={20}
		height='full'
		display='flex'
		flexDirection='column'
		bg='light'
		color='default'
		style={{ ...background }}
		{...props}
	>
		{children}
	</Box>
);

export default Card;

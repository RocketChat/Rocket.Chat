import { Box } from '@rocket.chat/fuselage';
import type { FC } from 'react';

type CardProps = {
	variant?: 'light' | 'tint';
};

const Card: FC<CardProps> = ({ variant, ...props }: CardProps) => (
	<Box
		borderRadius='x4'
		p='x20'
		height='full'
		display='flex'
		flexDirection='column'
		backgroundColor={variant === 'light' ? 'light' : 'tint'}
		{...props}
	/>
);

export default Card;

import { Box, Button } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

const letters = ['+', '', 'ABC', 'DEF', 'GHI', 'JKL', 'MNO', 'PQRS', 'TUV', 'WXYZ'];

const PadButton = ({
	children,
	onClickPadButton,
}: {
	children: string | number;
	onClickPadButton: (digit: string | number) => void;
}): ReactElement => (
	<Button
		m='8px'
		pb='8px'
		minWidth='28%'
		display='flex'
		flexGrow={1}
		flexShrink={0}
		flexDirection='column'
		alignItems='center'
		onClick={(): void => onClickPadButton(children)}
	>
		<Box fontSize='h2'>{children}</Box>
		<Box fontSize='c1' color='info'>
			{typeof children === 'number' && letters[children]}
		</Box>
	</Button>
);

export default PadButton;

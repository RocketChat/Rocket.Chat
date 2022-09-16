import { Box } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

type ColorTokenProps = {
	item: { name: string; token: string; color: string; isDark: boolean };
	position: number;
};
const ColorToken = ({ item, position }: ColorTokenProps): ReactElement => (
	<Box
		width='120px'
		height='120px'
		backgroundColor={item.color}
		display='flex'
		flexDirection='column'
		justifyContent='space-between'
		flexShrink={0}
		m='x4'
		mis={position === 0 ? '0' : 'x4'}
		p='x8'
		fontSize='10px'
		color={item.isDark ? 'white' : 'black'}
		fontWeight='600'
	>
		<Box>{item.name}</Box>
		<Box display='flex' justifyContent='space-between'>
			<Box>{item.color}</Box>
			<Box>{item.token}</Box>
		</Box>
	</Box>
);

export default ColorToken;

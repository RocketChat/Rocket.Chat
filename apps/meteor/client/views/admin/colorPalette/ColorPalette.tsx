import { Box, ButtonGroup, Label, RadioButton } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors.json';
import React, { ReactElement, SyntheticEvent, useState } from 'react';

type Token = {
	name: string;
	color: string;
	token: string;
};

const backgrounds = {
	light: { name: 'light', color: '#FFFFFF', token: 'white' },
	tint: {
		name: 'tint',
		color: '#F7F8FA',
		token: 'N100',
	},
};

const ColorPalette = (): ReactElement => {
	const [background, setBackground] = useState(backgrounds.light);

	const handleBackground = (e: SyntheticEvent): void => {
		const name = (e.target as HTMLInputElement).name as keyof typeof backgrounds;
		setBackground(backgrounds[name]);
	};
	return (
		<Box display='flex' flexDirection='column'>
			<Box is='h3' mb='x16'>
				Background
			</Box>
			<Box>
				{Object.values(backgrounds).map((item: Token) => (
					<ButtonGroup>
						<Label mb='x4'>{item.name}</Label>
						<RadioButton name={item.name} checked={item.name === background.name} onChange={handleBackground} />
					</ButtonGroup>
				))}
			</Box>
			<Box width='120px' height='120px' border={`2px solid ${colors.n600}`} backgroundColor={background.color}></Box>
			<Label>{background.name}</Label>
			<Label>{background.color}</Label>
			<Label>{background.token}</Label>
		</Box>
	);
};

export default ColorPalette;

import { Box } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import ColorToken from './ColorToken';
import { palette } from './palette';

const ColorPalette = (): ReactElement => {
	console.log('oi');

	return (
		<Box display='flex' flexDirection='column'>
			{palette.map((paletteItem) => (
				<>
					{paletteItem.category && (
						<Box fontScale='h2' mb='x16'>
							{paletteItem.category}
						</Box>
					)}
					{paletteItem.description && <Box fontScale='p2'>{paletteItem.description}</Box>}
					<Box display='flex' mb='x8'>
						{paletteItem.list.map((tokenItem) => (
							<ColorToken item={tokenItem} />
						))}
					</Box>
				</>
			))}
		</Box>
	);
};

export default ColorPalette;

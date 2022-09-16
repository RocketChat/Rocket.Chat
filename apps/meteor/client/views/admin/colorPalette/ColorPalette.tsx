import { Box } from '@rocket.chat/fuselage';
import React, { Fragment, ReactElement } from 'react';

import ColorToken from './ColorToken';
import { palette } from './palette';

const ColorPalette = (): ReactElement => (
	<Box display='flex' flexDirection='column' flexWrap='wrap'>
		{palette.map((paletteItem) => (
			<Fragment key={paletteItem.category}>
				{paletteItem.category && (
					<Box fontScale='h2' mb='x16'>
						{paletteItem.category}
					</Box>
				)}
				{paletteItem.description && <Box fontScale='p2'>{paletteItem.description}</Box>}
				<Box display='flex' mb='x8'>
					{paletteItem.list.map((tokenItem, i) => (
						<ColorToken item={tokenItem} key={tokenItem.name} position={i} />
					))}
				</Box>
			</Fragment>
		))}
	</Box>
);

export default ColorPalette;

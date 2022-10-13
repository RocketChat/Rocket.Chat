import { Box } from '@rocket.chat/fuselage';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import React, { Fragment, ReactElement } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import ColorToken from './ColorToken';
import { palette } from './palette';

const ColorPalette = (): ReactElement => {
	const { control, handleSubmit } = useFormContext();
	const saveSetting = useEndpoint('POST', '/v1/settings/Layout_Fuselage_Palette');
	return (
		<Box
			is='form'
			name='palette'
			id='palette'
			onSubmit={handleSubmit((data) => {
				saveSetting({ value: JSON.stringify(data) });
			})}
			display='flex'
			flexDirection='column'
			flexWrap='wrap'
		>
			{palette.map((paletteItem) => (
				<Fragment key={paletteItem.category}>
					{paletteItem.category && (
						<Box fontScale='h2' mb='x16'>
							{paletteItem.category}
						</Box>
					)}
					{paletteItem.description && <Box fontScale='p2'>{paletteItem.description}</Box>}
					<Box display='flex' mb='x8' flexWrap='wrap'>
						{paletteItem.list.map((tokenItem, i) => (
							<Controller
								key={tokenItem.name}
								control={control}
								name={tokenItem.name}
								render={({ field: { onChange, value } /* , fieldState: { invalid, isTouched, isDirty, error }*/ }): ReactElement => (
									<ColorToken item={tokenItem} position={i} onChange={onChange} value={value} />
								)}
							/>
						))}
					</Box>
				</Fragment>
			))}
		</Box>
	);
};

export default ColorPalette;

import { Box } from '@rocket.chat/fuselage';
import { filterOnlyChangedColors } from '@rocket.chat/ui-theming/src/filterOnlyChangedColors';
import { useSetLayoutSetting } from '@rocket.chat/ui-theming/src/hooks/useSetLayoutSetting';
import { defaultPalette, palette } from '@rocket.chat/ui-theming/src/palette';
import React, { Fragment, ReactElement } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import ColorToken from './ColorToken';

const ColorPalette = (): ReactElement => {
	const { control, handleSubmit, reset } = useFormContext();
	const saveSetting = useSetLayoutSetting();
	return (
		<Box
			is='form'
			name='palette'
			id='palette'
			onSubmit={handleSubmit((data) => {
				saveSetting({ value: JSON.stringify(filterOnlyChangedColors(defaultPalette, data)) });
				reset(data);
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
									<ColorToken name={tokenItem.name} token={tokenItem.token} position={i} onChange={onChange} value={value} />
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

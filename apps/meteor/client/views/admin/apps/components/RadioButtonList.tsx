import { Box, Option, RadioButton, Tile } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';

import type { RadioDropDownProps } from '../definitions/RadioDropDownDefinitions';

const RadioButtonList = ({ group, onSelected }: RadioDropDownProps): ReactElement => (
	<Tile overflow='auto' pb='x12' pi={0} elevation='2' w='full' bg='alternative' borderRadius='x2'>
		{group.label && (
			<Box pi='x16' pbs='x8' pbe='x4' fontScale='micro' textTransform='uppercase' color='default'>
				{group.label}
			</Box>
		)}
		{group.items.map((item) => (
			<Option key={item.id} label={item.label} onClick={(): void => onSelected(item)}>
				<RadioButton checked={item.checked} onChange={(): void => onSelected(item)} />
			</Option>
		))}
	</Tile>
);

export default RadioButtonList;

import { Box, Option, RadioButton, Tile } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';

import type { RadioDropDownProps } from '../definitions/RadioDropDownDefinitions';

const RadioButtonList = ({ group, onSelected }: RadioDropDownProps): ReactElement => (
	<Tile overflow='auto' pb={12} pi={0} elevation='2' w='full' bg='light' borderRadius='x2'>
		{group.label && (
			<Box pi={16} pbs={8} pbe={4} fontScale='micro' textTransform='uppercase' color='default'>
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

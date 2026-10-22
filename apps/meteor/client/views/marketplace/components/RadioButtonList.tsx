import { Box, Option, RadioButton, Tile } from '@rocket.chat/fuselage';

import type { RadioDropDownProps } from '../definitions/RadioDropDownDefinitions';

const RadioButtonList = ({ group, onSelected }: RadioDropDownProps) => (
	<Tile flush overflow='auto' paddingBlock={12} elevation='2' width='full' backgroundColor='light' borderRadius='small'>
		{group.label && (
			<Box paddingInline={16} paddingBlockStart={8} paddingBlockEnd={4} fontScale='micro' textTransform='uppercase' color='default'>
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

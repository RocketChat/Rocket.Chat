import { Box, Option, PopoverSurface, RadioButton } from '@rocket.chat/fuselage';

import type { RadioDropDownProps } from '../definitions/RadioDropDownDefinitions';

const RadioButtonList = ({ group, onSelected }: RadioDropDownProps) => (
	<PopoverSurface>
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
	</PopoverSurface>
);

export default RadioButtonList;

import { Option, OptionTitle, PopoverSurface, RadioButton } from '@rocket.chat/fuselage';

import type { RadioDropDownProps } from '../definitions/RadioDropDownDefinitions';

const RadioButtonList = ({ group, onSelected }: RadioDropDownProps) => (
	<PopoverSurface>
		{group.label && <OptionTitle>{group.label}</OptionTitle>}
		{group.items.map((item) => (
			<Option key={item.id} label={item.label} onClick={(): void => onSelected(item)}>
				<RadioButton checked={item.checked} onChange={(): void => onSelected(item)} />
			</Option>
		))}
	</PopoverSurface>
);

export default RadioButtonList;

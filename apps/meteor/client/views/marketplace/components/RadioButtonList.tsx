import { Option, PopoverSurface, RadioButton } from '@rocket.chat/fuselage';

import DropDownGroupLabel from './layout/DropDownGroupLabel';
import type { RadioDropDownProps } from '../definitions/RadioDropDownDefinitions';

const RadioButtonList = ({ group, onSelected }: RadioDropDownProps) => (
	<PopoverSurface>
		{group.label && <DropDownGroupLabel>{group.label}</DropDownGroupLabel>}
		{group.items.map((item) => (
			<Option key={item.id} label={item.label} onClick={(): void => onSelected(item)}>
				<RadioButton checked={item.checked} onChange={(): void => onSelected(item)} />
			</Option>
		))}
	</PopoverSurface>
);

export default RadioButtonList;

import { CheckBox, Option, PopoverSurface } from '@rocket.chat/fuselage';
import { Fragment } from 'react';

import type { CategoryDropDownListProps } from '../../definitions/CategoryDropdownDefinitions';
import DropDownGroupLabel from '../layout/DropDownGroupLabel';

const CategoryDropDownList = ({ categories, onSelected }: CategoryDropDownListProps) => {
	return (
		<PopoverSurface>
			{categories.map((category, index) => (
				<Fragment key={index}>
					{category.label && <DropDownGroupLabel>{category.label}</DropDownGroupLabel>}
					{category.items.map((item) => (
						<Option key={item.id} {...({ label: item.label } as any)} onClick={(): void => onSelected(item)}>
							<CheckBox checked={item.checked} onChange={(): void => onSelected(item)} />
						</Option>
					))}
				</Fragment>
			))}
		</PopoverSurface>
	);
};

export default CategoryDropDownList;

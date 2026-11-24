import { CheckBox, Option, OptionTitle, PopoverSurface } from '@rocket.chat/fuselage';
import { Fragment } from 'react';

import type { CategoryDropDownListProps } from '../../definitions/CategoryDropdownDefinitions';

const CategoryDropDownList = ({ categories, onSelected }: CategoryDropDownListProps) => {
	return (
		<PopoverSurface>
			{categories.map((category, index) => (
				<Fragment key={index}>
					{category.label && <OptionTitle>{category.label}</OptionTitle>}
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

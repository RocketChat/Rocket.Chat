import { Box, CheckBox, Option, PopoverSurface } from '@rocket.chat/fuselage';
import { Fragment } from 'react';

import type { CategoryDropDownListProps } from '../../definitions/CategoryDropdownDefinitions';

const CategoryDropDownList = ({ categories, onSelected }: CategoryDropDownListProps) => {
	return (
		<PopoverSurface>
			{categories.map((category, index) => (
				<Fragment key={index}>
					{category.label && (
						<Box paddingInline={16} paddingBlockStart={8} paddingBlockEnd={4} fontScale='micro' textTransform='uppercase' color='default'>
							{category.label}
						</Box>
					)}
					{category.items.map((item) => (
					<Option key={item.id} label={item.label} onClick={(): void => onSelected(item)}>
							<CheckBox checked={item.checked} onChange={(): void => onSelected(item)} />
						</Option>
					))}
				</Fragment>
			))}
		</PopoverSurface>
	);
};

export default CategoryDropDownList;

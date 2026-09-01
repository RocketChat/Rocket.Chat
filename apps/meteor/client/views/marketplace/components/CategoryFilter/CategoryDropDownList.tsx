import { Box, CheckBox, Option, Tile } from '@rocket.chat/fuselage';
import { Fragment } from 'react';

import type { CategoryDropDownListProps } from '../../definitions/CategoryDropdownDefinitions';

const CategoryDropDownList = ({ categories, onSelected }: CategoryDropDownListProps) => {
	return (
		<Tile overflow='auto' paddingBlock={12} paddingInline={0} elevation='2' width='full' backgroundColor='light' borderRadius={2}>
			{categories.map((category, index) => (
				<Fragment key={index}>
					{category.label && (
						<Box paddingInline={16} paddingBlockStart={8} paddingBlockEnd={4} fontScale='micro' textTransform='uppercase' color='default'>
							{category.label}
						</Box>
					)}
					{category.items.map((item) => (
						<Option key={item.id} {...({ label: item.label } as any)} onClick={(): void => onSelected(item)}>
							<CheckBox checked={item.checked} onChange={(): void => onSelected(item)} />
						</Option>
					))}
				</Fragment>
			))}
		</Tile>
	);
};

export default CategoryDropDownList;

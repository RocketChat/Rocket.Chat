import { Box, CheckBox, Option, Tile } from '@rocket.chat/fuselage';
import React, { FC, Fragment } from 'react';

import { CategoryDropDownListProps } from '../definitions/CategoryDropdownDefinitions';

const CategoryDropDownList: FC<CategoryDropDownListProps> = function CategoryDropDownList({ groups, onSelected }) {
	return (
		<Tile overflow='auto' pb='x12' pi={0} elevation='2' w='full' bg='alternative' borderRadius='x2'>
			{groups.map((group, index) => (
				<Fragment key={index}>
					{group.label && (
						<Box pi='x16' pbs='x8' pbe='x4' fontScale='micro' textTransform='uppercase' color='default'>
							{group.label}
						</Box>
					)}
					{group.items.map((item) => (
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

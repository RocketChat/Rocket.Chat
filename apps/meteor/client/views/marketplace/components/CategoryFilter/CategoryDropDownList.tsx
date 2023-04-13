import { Box, CheckBox, Option, Tile } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React, { Fragment } from 'react';

import type { CategoryDropDownListProps } from '../../definitions/CategoryDropdownDefinitions';

const CategoryDropDownList = ({ categories, onSelected }: CategoryDropDownListProps): ReactElement => {
	return (
		<Tile overflow='auto' pb='x12' pi={0} elevation='2' w='full' bg='light' borderRadius='x2'>
			{categories.map((category, index) => (
				<Fragment key={index}>
					{category.label && (
						<Box pi='x16' pbs='x8' pbe='x4' fontScale='micro' textTransform='uppercase' color='default'>
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

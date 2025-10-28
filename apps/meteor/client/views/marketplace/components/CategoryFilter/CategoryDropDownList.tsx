import { Box, CheckBox, Option, Tile } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { Fragment } from 'react';

import type { CategoryDropDownListProps } from '../../definitions/CategoryDropdownDefinitions';

const CategoryDropDownList = ({ categories, onSelected }: CategoryDropDownListProps): ReactElement => {
	return (
		<Tile overflow='auto' pb={12} pi={0} elevation='2' w='full' bg='light' borderRadius={2}>
			{categories.map((category, index) => (
				<Fragment key={index}>
					{category.label && (
						<Box pi={16} pbs={8} pbe={4} fontScale='micro' textTransform='uppercase' color='default'>
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

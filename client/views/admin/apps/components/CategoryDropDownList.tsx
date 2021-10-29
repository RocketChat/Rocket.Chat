import { Box, CheckBox, Option, Tile } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

export type CategoryDropdownItem = {
	id: string;
	label: string;
	checked?: boolean;
};

export type CategoryDropDownListProps = {
	groups: {
		label?: string;
		items: CategoryDropdownItem[];
	}[];
	onSelected: (item: CategoryDropdownItem) => void;
};

const CategoryDropDownList: FC<CategoryDropDownListProps> = ({ groups, onSelected }) => (
	<Box>
		{JSON.stringify(groups)}
		<Tile padding={0} paddingBlock={'x12'} paddingInline={0} elevation='2'>
			{groups.map((group) => (
				<>
					{group.label && <Box>{group.label}</Box>}
					{group.items.map((item) => (
						<Option key={item.id} {...({ label: item.label } as any)}>
							<CheckBox checked={item.checked} onChange={(): void => onSelected(item)} />
						</Option>
					))}
				</>
			))}
		</Tile>
	</Box>
);

export default CategoryDropDownList;

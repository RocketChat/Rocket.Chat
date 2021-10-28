import { Box, CheckBox, Option, Tile } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

type Item = {
	id: string;
	label: string;
	checked: boolean;
};

type CategoryDropDownListProps = {
	groups: {
		label?: string;
		items: Item[];
	}[];
	onSelected: (item: Item) => void;
};

const CategoryDropDownList: FC<CategoryDropDownListProps> = ({ groups, onSelected }) => (
	<Box>
		<Tile padding={0} paddingBlock={'x12'} paddingInline={0} elevation='2'>
			{groups.map((group) => (
				<>
					{group.label && <Box>{group.label}</Box>}
					{group.items.map((item) => (
						<Option
							key={item.id}
							{...({ label: item.label } as any)}
							onClick={(): void => onSelected(item)}
						>
							<CheckBox checked={item.checked} />
						</Option>
					))}
				</>
			))}
		</Tile>
	</Box>
);

export default CategoryDropDownList;

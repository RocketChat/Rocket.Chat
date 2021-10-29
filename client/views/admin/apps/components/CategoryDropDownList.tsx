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

const style = {
	boxShadow: '0px 0px 2px rgba(0, 0, 0, 0.08), 0px 0px 12px rgba(47, 52, 61, 0.1)',
};

const CategoryDropDownList: FC<CategoryDropDownListProps> = ({ groups, onSelected }) => (
	<Box display='flex' flexDirection='column' alignItems='center' justifyContent='center'>
		{JSON.stringify(groups)}
		<Tile
			style={style}
			padding={0}
			paddingBlock={'x12'}
			paddingInline={0}
			elevation='2'
			width='224px'
			backgroundColor='#ffffff'
			borderRadius='2px'
		>
			{groups.map((group) => (
				<>
					{group.label && (
						<Box
							padding='0.5rem 1rem 0.75rem 1rem'
							fontFamily='Inter'
							fontSize='0.625rem'
							lineHeight='0.75rem'
							textTransform='uppercase'
							color='#2F343D'
						>
							{group.label}
						</Box>
					)}
					{group.items.map((item) => (
						<Option
							key={item.id}
							{...({ label: item.label } as any)}
							onClick={(): void => onSelected(item)}
						>
							<CheckBox checked={item.checked} onChange={(): void => onSelected(item)} />
						</Option>
					))}
				</>
			))}
		</Tile>
	</Box>
);

export default CategoryDropDownList;

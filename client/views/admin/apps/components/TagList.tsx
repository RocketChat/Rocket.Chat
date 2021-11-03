import { Chip } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import {
	CategoryDropdownItem,
	CategoryDropDownListProps,
} from '../definitions/CategoryDropdownDefinitions';

const TagList: FC<{
	categories: (CategoryDropdownItem & { checked: true })[];
	onClick: CategoryDropDownListProps['onSelected'];
}> = ({ categories, onClick }) => (
	<>
		{categories &&
			categories.map((category) => (
				<Chip key={category.id} onClick={(): void => onClick(category)} disabled={undefined}>
					{category.label}
				</Chip>
			))}
	</>
);

export default TagList;

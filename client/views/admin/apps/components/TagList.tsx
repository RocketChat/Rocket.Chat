import { Chip } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import {
	CategoryDropdownItem,
	CategoryDropDownListProps,
} from '../definitions/CategoryDropdownDefinitions';

const TagList: FC<{
	categories: (CategoryDropdownItem & { checked: true })[];
	onClick: CategoryDropDownListProps['onSelected'];
	originalCategoryList?: CategoryDropdownItem[];
	tagGap?: string;
}> = ({ categories, onClick, originalCategoryList, tagGap }) => (
	<>
		{categories &&
			originalCategoryList &&
			categories.length !== originalCategoryList.length &&
			categories.map((category) => (
				<Chip
					mie={tagGap}
					mbe={tagGap}
					key={category.id}
					onClick={(): void => onClick(category)}
					disabled={undefined}
				>
					{category.label}
				</Chip>
			))}
	</>
);

export default TagList;

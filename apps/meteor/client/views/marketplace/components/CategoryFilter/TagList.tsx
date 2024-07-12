import { Chip, ButtonGroup } from '@rocket.chat/fuselage';
import React from 'react';

import type { CategoryDropdownItem, CategoryDropDownListProps } from '../../definitions/CategoryDropdownDefinitions';

type TagListProps = {
	categories: (CategoryDropdownItem & { checked: true })[];
	onClick: CategoryDropDownListProps['onSelected'];
};

const TagList = ({ categories, onClick }: TagListProps) => (
	<ButtonGroup wrap small>
		{categories.map((category) => (
			<Chip flexShrink={0} key={category.id} onClick={(): void => onClick(category)} disabled={undefined} mbe={8}>
				{category.label}
			</Chip>
		))}
	</ButtonGroup>
);

export default TagList;

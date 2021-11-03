import { Chip } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import { TagListProps } from '../definitions/TagListDefinitions';

const TagList: FC<TagListProps> = ({ selectedCategories, onClick }) => (
	<>
		{selectedCategories &&
			selectedCategories.map((category) => (
				<Chip key={category.id} onClick={(): void => onClick(category)}>
					{category.label}
				</Chip>
			))}
	</>
);

export default TagList;

import { Chip } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import { TagListProps } from '../definitions/TagListDefinitions';

const TagList: FC<TagListProps> = ({ selectedCategories, onRemoved }) => (
	<>
		{selectedCategories &&
			selectedCategories.map((category) => (
				<Chip
					key={category.id}
					display='inline'
					mie='x6'
					mb='x6'
					bg='#EEEFF1'
					borderRadius='2px'
					onClick={(): void => onRemoved(category)}
				>
					{category.label}
				</Chip>
			))}
	</>
);

export default TagList;

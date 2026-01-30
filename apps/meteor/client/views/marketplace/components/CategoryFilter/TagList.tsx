import { Chip, ButtonGroup } from '@rocket.chat/fuselage';

import type { CategoryDropdownItem, CategoryDropDownListProps } from '../../definitions/CategoryDropdownDefinitions';

type TagListProps = {
	categories: (CategoryDropdownItem & { checked: true })[];
	onClick: CategoryDropDownListProps['onSelected'];
};

const TagList = ({ categories, onClick }: TagListProps) => {
	if (!categories.length) {
		return null;
	}

	return (
		<ButtonGroup wrap small>
			{categories.map((category) => (
				<Chip key={category.id} onClick={() => onClick(category)}>
					{category.label}
				</Chip>
			))}
		</ButtonGroup>
	);
};

export default TagList;

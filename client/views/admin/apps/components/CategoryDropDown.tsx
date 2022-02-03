import { useToggle } from '@rocket.chat/fuselage-hooks';
import React, { useRef, FC, useCallback } from 'react';

import { CategoryDropdownItem, CategoryDropDownListProps } from '../definitions/CategoryDropdownDefinitions';
import CategoryDropDownAnchor from './CategoryDropDownAnchor';
import CategoryDropDownList from './CategoryDropDownList';
import DropDownListWrapper from './DropDownListWrapper';

const CategoryDropDown: FC<{
	data: CategoryDropDownListProps['groups'];
	onSelected: CategoryDropDownListProps['onSelected'];
	selectedCategories: (CategoryDropdownItem & { checked: true })[];
}> = ({ data, onSelected, selectedCategories, ...props }) => {
	const reference = useRef<HTMLElement>(null);
	const [collapsed, toggleCollapsed] = useToggle(false);

	const onClose = useCallback(
		(e) => {
			if (e.target !== reference.current && !reference.current?.contains(e.target)) {
				toggleCollapsed(false);
				return;
			}
			e.preventDefault();
			e.stopPropagation();
			e.stopImmediatePropagation();
			return false;
		},
		[toggleCollapsed],
	);

	return (
		<>
			<CategoryDropDownAnchor
				ref={reference}
				onClick={toggleCollapsed as any}
				selectedCategoriesCount={selectedCategories.length}
				{...props}
			/>
			{collapsed && (
				<DropDownListWrapper ref={reference} onClose={onClose}>
					<CategoryDropDownList groups={data} onSelected={onSelected} />
				</DropDownListWrapper>
			)}
		</>
	);
};

export default CategoryDropDown;

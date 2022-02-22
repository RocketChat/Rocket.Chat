import { useToggle } from '@rocket.chat/fuselage-hooks';
import React, { useRef, FC, useCallback } from 'react';

import { CategoryDropdownItem, CategoryDropDownListProps } from '../../definitions/CategoryDropdownDefinitions';
import { isValidReference } from '../../helpers/isValidReference';
import { onMouseEventPreventSideEffects } from '../../helpers/onMouseEventPreventSideEffects';
import DropDownListWrapper from '../DropDownListWrapper';
import CategoryDropDownAnchor from './CategoryDropDownAnchor';
import CategoryDropDownList from './CategoryDropDownList';

const CategoryDropDown: FC<{
	data: CategoryDropDownListProps['groups'];
	onSelected: CategoryDropDownListProps['onSelected'];
	selectedCategories: (CategoryDropdownItem & { checked: true })[];
}> = ({ data, onSelected, selectedCategories, ...props }) => {
	const reference = useRef<HTMLInputElement>(null);
	const [collapsed, toggleCollapsed] = useToggle(false);

	const onClose = useCallback(
		(e) => {
			if (isValidReference(reference, e)) {
				toggleCollapsed(false);
				return;
			}

			onMouseEventPreventSideEffects(e);

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

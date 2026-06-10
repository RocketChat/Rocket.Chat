import type { Button } from '@rocket.chat/fuselage';
import { useToggle } from '@rocket.chat/fuselage-hooks';
import type { ComponentProps } from 'react';
import { useRef, useCallback } from 'react';

import CategoryDropDownAnchor from './CategoryDropDownAnchor';
import CategoryDropDownList from './CategoryDropDownList';
import type { CategoryDropdownItem, CategoryDropDownListProps } from '../../definitions/CategoryDropdownDefinitions';
import { isValidReference } from '../../helpers/isValidReference';
import { onMouseEventPreventSideEffects } from '../../helpers/onMouseEventPreventSideEffects';
import DropDownListWrapper from '../DropDownListWrapper';

type CategoryDropDownProps = {
	categories: CategoryDropDownListProps['categories'];
	onSelected: CategoryDropDownListProps['onSelected'];
	selectedCategories: (CategoryDropdownItem & { checked: true })[];
} & ComponentProps<typeof Button>;

const CategoryDropDown = ({ categories, onSelected, selectedCategories, ...props }: CategoryDropDownProps) => {
	const reference = useRef<HTMLInputElement>(null);
	const [collapsed, toggleCollapsed] = useToggle(false);

	const onClose = useCallback(
		(e: MouseEvent) => {
			if (isValidReference(reference, e as { target: Node | null })) {
				toggleCollapsed(false);
				return;
			}

			onMouseEventPreventSideEffects(e);
		},
		[toggleCollapsed],
	);

	return (
		<>
			<CategoryDropDownAnchor
				ref={reference}
				onClick={() => toggleCollapsed()}
				selectedCategoriesCount={selectedCategories.length}
				{...props}
			/>
			{collapsed && (
				<DropDownListWrapper ref={reference} onClose={onClose}>
					<CategoryDropDownList categories={categories} onSelected={onSelected} />
				</DropDownListWrapper>
			)}
		</>
	);
};

export default CategoryDropDown;

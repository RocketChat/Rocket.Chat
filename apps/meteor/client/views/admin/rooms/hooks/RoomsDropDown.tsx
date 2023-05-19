import type { Button } from '@rocket.chat/fuselage';
import { useToggle } from '@rocket.chat/fuselage-hooks';
import React, { useCallback, useRef } from 'react';
import type { ComponentProps, ReactElement } from 'react';

import CategoryDropDownList from '../../../marketplace/components/CategoryFilter/CategoryDropDownList';
import DropDownListWrapper from '../../../marketplace/components/DropDownListWrapper';
import { isValidReference } from '../../../marketplace/helpers/isValidReference';
import { onMouseEventPreventSideEffects } from '../../../marketplace/helpers/onMouseEventPreventSideEffects';
import type { RoomDropDownGroups, RoomDropdownItem, selectedCategoriesList } from './RoomDropdownDefinitions';

const RoomsDropDown = ({
	categories,
	onSelected,
	selectedCategories,
	...props
}: {
	categories: RoomDropDownGroups;
	onSelected: (item: RoomDropdownItem) => void;
	selectedCategories: selectedCategoriesList;
} & ComponentProps<typeof Button>): ReactElement => {
	const reference = useRef<HTMLInputElement>(null);
	const [collapsed, toggleCollapsed] = useToggle(false);

	const onClose = useCallback(
		(e) => {
			if (isValidReference(reference, e)) {
				toggleCollapsed(false);
				return;
			}

			onMouseEventPreventSideEffects(e);
		},
		[toggleCollapsed],
	);

	return (
		<>
			<RoomDropDownAnchor ref={reference} onClick={toggleCollapsed as any} selectedCategoriesCount={selectedCategories.length} {...props} />
			{collapsed && (
				<DropDownListWrapper ref={reference} onClose={onClose}>
					<CategoryDropDownList categories={categories} onSelected={onSelected} />
				</DropDownListWrapper>
			)}
		</>
	);
};

export default RoomsDropDown;

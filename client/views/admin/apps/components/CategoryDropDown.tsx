import { useToggle } from '@rocket.chat/fuselage-hooks';
import React, { useRef, FC, useCallback, ComponentProps } from 'react';

import { CategoryDropDownListProps } from '../definitions/CategoryDropdownDefinitions';
import CategoryDropDownAnchor from './CategoryDropDownAnchor';
import CategoryDropDownList from './CategoryDropDownList';
import CategoryDropDownListWrapper from './CategoryDropDownListWrapper';

const CategoryDropDown: FC<
	{
		data: CategoryDropDownListProps['groups'];
		onSelected: CategoryDropDownListProps['onSelected'];
	} & Partial<Pick<ComponentProps<typeof CategoryDropDownAnchor>, 'small' | 'mini'>>
> = ({ data, onSelected, ...props }) => {
	const reference = useRef<HTMLElement>(null);
	const [collapsed, toogleCollapsed] = useToggle(false);

	const onClose = useCallback(
		(e) => {
			e.preventDefault();
			e.stopPropagation();
			toogleCollapsed();
			return false;
		},
		[toogleCollapsed],
	);

	return (
		<>
			<CategoryDropDownAnchor ref={reference} onClick={toogleCollapsed as any} {...props} />
			{collapsed && (
				<CategoryDropDownListWrapper ref={reference} onClose={onClose}>
					<CategoryDropDownList groups={data} onSelected={onSelected} />
				</CategoryDropDownListWrapper>
			)}
		</>
	);
};

export default CategoryDropDown;

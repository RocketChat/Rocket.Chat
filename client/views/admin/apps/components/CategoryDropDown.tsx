import { Box } from '@rocket.chat/fuselage';
import { useToggle } from '@rocket.chat/fuselage-hooks';
import React, { useRef, FC, useCallback, ComponentProps } from 'react';

import { useOutsideClick } from '../../../../hooks/useOutsideClick';
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
	const [collapsed, toggleCollapsed] = useToggle(false);
	const target = useRef(null);

	const onClose = useCallback(
		(e) => {
			e.preventDefault();
			e.stopPropagation();
			e.stopImmediatePropagation();
			toggleCollapsed(false);
			return false;
		},
		[toggleCollapsed],
	);

	useOutsideClick(target, onClose);

	return (
		<Box ref={target}>
			<CategoryDropDownAnchor ref={reference} onClick={toggleCollapsed as any} {...props} />
			{collapsed && (
				<CategoryDropDownListWrapper ref={reference}>
					<CategoryDropDownList groups={data} onSelected={onSelected} />
				</CategoryDropDownListWrapper>
			)}
		</Box>
	);
};

export default CategoryDropDown;

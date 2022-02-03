import { useToggle } from '@rocket.chat/fuselage-hooks';
import React, { FC, useCallback, useRef } from 'react';

import { FreePaidDropDownProps } from '../definitions/FreePaidDropDownDefinitions';
import DropDownListWrapper from './DropDownListWrapper';
import FreePaidDropDownAnchor from './FreePaidDropDownAnchor';
import FreePaidDropDownList from './FreePaidDropDownList';

const FreePaidDropDown: FC<FreePaidDropDownProps> = ({ group, onSelected, ...props }) => {
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
			<FreePaidDropDownAnchor ref={reference} onClick={toggleCollapsed as any} group={group} {...props} />
			{collapsed && (
				<DropDownListWrapper ref={reference} onClose={onClose}>
					<FreePaidDropDownList group={group} onSelected={onSelected} />
				</DropDownListWrapper>
			)}
		</>
	);
};

export default FreePaidDropDown;

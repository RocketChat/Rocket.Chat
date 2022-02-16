import { useToggle } from '@rocket.chat/fuselage-hooks';
import React, { FC, useCallback, useRef } from 'react';

import { RadioDropDownProps } from '../../definitions/RadioDropDownDefinitions';
import { isValidReference } from '../../helpers/isValidReference';
import { onMouseEventPreventSideEffects } from '../../helpers/preventSideEffects';
import DropDownListWrapper from '../DropDownListWrapper';
import RadioButtonList from '../RadioButtonList';
import FreePaidDropDownAnchor from './FreePaidDropDownAnchor';

const FreePaidDropDown: FC<RadioDropDownProps> = ({ group, onSelected, ...props }) => {
	const reference = useRef<HTMLInputElement>(null);
	const [collapsed, toggleCollapsed] = useToggle(false);

	const onClose = useCallback(
		(e) => {
			if (isValidReference(reference, e)) {
				toggleCollapsed(false);
				return;
			}

			// TODO Create index file for helpers
			onMouseEventPreventSideEffects(e);

			return false;
		},
		[toggleCollapsed],
	);

	return (
		<>
			<FreePaidDropDownAnchor ref={reference} onClick={toggleCollapsed as any} group={group} {...props} />
			{collapsed && (
				<DropDownListWrapper ref={reference} onClose={onClose}>
					<RadioButtonList group={group} onSelected={onSelected} />
				</DropDownListWrapper>
			)}
		</>
	);
};

export default FreePaidDropDown;

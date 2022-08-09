import { Select } from '@rocket.chat/fuselage';
import { useToggle } from '@rocket.chat/fuselage-hooks';
import React, { ComponentProps, FC, useCallback, useRef } from 'react';

import { RadioDropDownProps } from '../../definitions/RadioDropDownDefinitions';
import { isValidReference } from '../../helpers/isValidReference';
import { onMouseEventPreventSideEffects } from '../../helpers/onMouseEventPreventSideEffects';
import DropDownListWrapper from '../DropDownListWrapper';
import RadioButtonList from '../RadioButtonList';
import RadioDropDownAnchor from './RadioDownAnchor';

const RadioDropDown: FC<RadioDropDownProps & Partial<ComponentProps<typeof Select>>> = ({ group, onSelected, ...props }) => {
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
			<RadioDropDownAnchor ref={reference} group={group} onClick={toggleCollapsed as any} {...props} />
			{collapsed && (
				<DropDownListWrapper ref={reference} onClose={onClose}>
					<RadioButtonList group={group} onSelected={onSelected} />
				</DropDownListWrapper>
			)}
		</>
	);
};

export default RadioDropDown;

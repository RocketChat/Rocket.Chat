import { useToggle } from '@rocket.chat/fuselage-hooks';
import React, { createContext, useCallback, useRef, useState } from 'react';

import { isValidReference } from '../../../marketplace/helpers/isValidReference';
import { onMouseEventPreventSideEffects } from '../../../marketplace/helpers/onMouseEventPreventSideEffects';
import type { DropDownProps, OptionProp } from './CustomDropDown';
import { DropDownAnchor, DropDownList, DropDownListWrapper } from './CustomDropDown';

export const RoomVisibilityDropDownOptionsContext = createContext<OptionProp[]>([]);

export const RoomVisibilityDropDown = ({ dropdownOptions, defaultTitle, selectedOptionsTitle }: DropDownProps) => {
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

	// TODO: create a context that provides the selectedOptions list globally

	const [selectedOptions, setSelectedOptions] = useState<OptionProp[]>([]);

	const onSelect = (item: OptionProp): void => {
		item.checked = !item.checked;

		if (item.checked === true) {
			// the user has enabled this option -> add it to the selected options
			setSelectedOptions([...selectedOptions, item]);
		} else {
			// the user has disabled this option -> remove this from the selected options list
			setSelectedOptions(selectedOptions.filter((option: OptionProp) => option.id !== item.id));
		}
	};

	return (
		<>
			<RoomVisibilityDropDownOptionsContext.Provider value={selectedOptions}>
				<DropDownAnchor
					ref={reference}
					onClick={toggleCollapsed as any}
					defaultTitle={defaultTitle}
					selectedOptionsTitle={selectedOptionsTitle}
					selectedOptionsCount={selectedOptions.length}
				/>
				{collapsed && (
					<DropDownListWrapper ref={reference} onClose={onClose}>
						<DropDownList options={dropdownOptions} onSelected={onSelect} />
					</DropDownListWrapper>
				)}
			</RoomVisibilityDropDownOptionsContext.Provider>
		</>
	);
};

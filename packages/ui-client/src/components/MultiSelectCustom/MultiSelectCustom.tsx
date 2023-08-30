import { Box } from '@rocket.chat/fuselage';
import { useToggle } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import type { Dispatch, FormEvent, ReactElement, RefObject, SetStateAction } from 'react';
import { useCallback, useRef } from 'react';

import MultiSelectCustomAnchor from './MultiSelectCustomAnchor';
import MultiSelectCustomList from './MultiSelectCustomList';
import MultiSelectCustomListWrapper from './MultiSelectCustomListWrapper';

const isValidReference = (reference: RefObject<HTMLElement>, e: { target: Node | null }): boolean => {
	const isValidTarget = Boolean(e.target);
	const isValidReference = e.target !== reference.current && !reference.current?.contains(e.target);

	return isValidTarget && isValidReference;
};

const onMouseEventPreventSideEffects = (e: MouseEvent): void => {
	e.preventDefault();
	e.stopPropagation();
	e.stopImmediatePropagation();
};

type TitleOptionProp = {
	id: string;
	text: string;
	isGroupTitle: boolean;
	checked: never;
};

type CheckboxOptionProp = {
	id: string;
	text: string;
	isGroupTitle: never;
	checked: boolean;
};

export type OptionProp = TitleOptionProp | CheckboxOptionProp;

/**
 * @param dropdownOptions options available for the multiselect dropdown list
 * @param defaultTitle dropdown text before selecting any options (or all of them). For example: 'All rooms'
	@param selectedOptionsTitle dropdown text after clicking one or more options. For example: 'Rooms (3)'
 * @param selectedOptions array with clicked options. This is used in the useFilteredTypeRooms hook, to filter the Rooms' table, for example. This array joins all of the individual clicked options from all available MultiSelectCustom components in the page. It helps to create a union filter for all the selections.
 * @param setSelectedOptions part of an useState hook to set the previous selectedOptions
 * @param customSetSelected part of an useState hook to set the individual selected checkboxes from this instance.
 * @param searchBarText optional text prop that creates a search bar inside the dropdown, when added.
 * @returns a React Component that should be used with a custom hook for filters, such as useFilteredTypeRooms.tsx.
 * Check out the following files, for examples:
 * 	useFilteredTypeRooms.tsx,
 * 	useFilteredVisibility.tsx,
 * 	RoomsTable.tsx
 */
type DropDownProps = {
	dropdownOptions: OptionProp[];
	defaultTitle: TranslationKey; // For example: 'All rooms'
	selectedOptionsTitle: TranslationKey; // For example: 'Rooms (3)'
	selectedOptions: OptionProp[];
	setSelectedOptions: Dispatch<SetStateAction<OptionProp[]>>;
	customSetSelected: Dispatch<SetStateAction<OptionProp[]>>;
	searchBarText?: TranslationKey;
};

export const MultiSelectCustom = ({
	dropdownOptions,
	defaultTitle,
	selectedOptionsTitle,
	selectedOptions,
	setSelectedOptions,
	customSetSelected,
	searchBarText,
}: DropDownProps): ReactElement => {
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

	const onSelect = (item: OptionProp, e?: FormEvent<HTMLElement>): void => {
		e?.stopPropagation();

		item.checked = !item.checked;

		if (item.checked === true) {
			// the user has enabled this option -> add it to the selected options
			setSelectedOptions([...new Set([...selectedOptions, item])]);
			customSetSelected((prevItems) => {
				const newItems = prevItems;
				const toggledItem = newItems.find(({ id }) => id === item.id);

				if (toggledItem) {
					toggledItem.checked = !toggledItem.checked;
				}

				return [...prevItems];
			});
		} else {
			// the user has disabled this option -> remove this from the selected options list
			setSelectedOptions(selectedOptions.filter((option: OptionProp) => option.id !== item.id));
		}
	};

	const count = dropdownOptions.filter((option) => option.checked).length;

	return (
		<Box display='flex' flexGrow={1} position='relative'>
			<MultiSelectCustomAnchor
				ref={reference}
				onClick={toggleCollapsed as any}
				collapsed={collapsed}
				defaultTitle={defaultTitle}
				selectedOptionsTitle={selectedOptionsTitle}
				selectedOptionsCount={count}
				maxCount={dropdownOptions.length}
			/>
			{collapsed && (
				<MultiSelectCustomListWrapper ref={reference} onClose={onClose}>
					<MultiSelectCustomList options={dropdownOptions} onSelected={onSelect} searchBarText={searchBarText} />
				</MultiSelectCustomListWrapper>
			)}
		</Box>
	);
};

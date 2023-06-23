/* eslint-disable react/no-multi-comp */
import { Box, Button, CheckBox, Icon, Option, Tile } from '@rocket.chat/fuselage';
import { useOutsideClick, usePosition, useToggle } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentProps, Dispatch, FormEvent, MouseEventHandler, SetStateAction } from 'react';
import React, { Fragment, forwardRef, useCallback, useRef } from 'react';

import { isValidReference } from '../../../marketplace/helpers/isValidReference';
import { onMouseEventPreventSideEffects } from '../../../marketplace/helpers/onMouseEventPreventSideEffects';

/**
 * @param dropdownOptions options available for the multiselect dropdown list
 * @param defaultTitle dropdown text before selecting any options (or all of them). For example: 'All rooms'
	@param selectedOptionsTitle dropdown text after clicking one or more options. For example: 'Rooms (3)'
 * @param selectedOptions array with clicked options. This is used in the useFilteredRooms hook, to filter the Rooms' table. This array joins all of the individual clicked options from all available CustomDropDown components in the page. It helps to create a union filter for all the selections.
 * @param setSelectedOptions part of an useState hook to set the previous selectedOptions
 * @param customSetSelected part of an useState hook to set the individual selected checkboxes from this instance.
 * @returns a React Component that should be used with a custom hook for filters, such as useFilteredRooms.tsx.
 * Check out the following files, for examples: 
 * 	useFilteredRooms.tsx,
 * 	RoomsTable.tsx
 */

// TODO: remove multicomponents from file!!!

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

export type DropDownProps = {
	dropdownOptions: OptionProp[];
	defaultTitle: TranslationKey; // For example: 'All rooms'
	selectedOptionsTitle: TranslationKey; // For example: 'Rooms (3)'
	selectedOptions: OptionProp[];
	setSelectedOptions: Dispatch<SetStateAction<OptionProp[]>>;
	customSetSelected: Dispatch<SetStateAction<OptionProp[]>>;
};

// TODO: move CustomDropDownAnchor to new file!!

type CustomDropDownAnchorProps = {
	onClick?: MouseEventHandler<HTMLElement>;
	defaultTitle: TranslationKey;
	selectedOptionsTitle: TranslationKey;
	selectedOptionsCount: number;
	maxCount: number;
} & ComponentProps<typeof Button>;

export const CustomDropDownAnchor = forwardRef<HTMLElement, CustomDropDownAnchorProps>(function CustomDropDownAnchor(
	{ onClick, selectedOptionsCount, selectedOptionsTitle, defaultTitle, maxCount, ...props },
	ref,
) {
	const t = useTranslation();

	return (
		<Button
			ref={ref}
			onClick={onClick}
			display='flex'
			justifyContent='space-between'
			flexDirection='row'
			flexGrow='1'
			flexShrink='1'
			borderColor='none'
			borderWidth='x1'
			bg='surface-light'
			mis='x9'
			h='x40'
			{...props}
		>
			{selectedOptionsCount > 0 && selectedOptionsCount !== maxCount - 1
				? `${t(selectedOptionsTitle)} (${selectedOptionsCount})`
				: t(defaultTitle)}
			<Box mi='x4' display='flex' alignItems='center' justifyContent='center'>
				<Icon name='chevron-down' fontSize='x20' color='hint' />
			</Box>
		</Button>
	);
});

// TODO: move CustomDropDownListWrapper to new file!!

const options = {
	margin: 8,
	placement: 'bottom-end',
} as const;

const hidden = {
	visibility: 'hidden',
	opacity: 0,
	position: 'fixed',
} as const;

export const CustomDropDownListWrapper = forwardRef<Element, ComponentProps<typeof Box> & { onClose: (e: MouseEvent) => void }>(
	function CustomDropDownListWrapper({ children, onClose }, ref) {
		const target = useRef<HTMLElement>(null);
		useOutsideClick([target], onClose);
		const { style = hidden } = usePosition(ref as Parameters<typeof usePosition>[0], target, options);
		return (
			<Box ref={target} style={style} minWidth={224} zIndex='99999'>
				{children}
			</Box>
		);
	},
);

// TODO: move CustomDropDownList to new file!!

export const CustomDropDownList = ({
	options,
	onSelected,
}: {
	options: OptionProp[];
	onSelected: (item: OptionProp, e?: FormEvent<HTMLElement>) => void;
}) => {
	const t = useTranslation();

	return (
		<Tile overflow='auto' pb='x12' pi={0} elevation='2' w='full' bg='light' borderRadius='x2'>
			{options.map((option) => (
				<Fragment key={option.id}>
					{option.isGroupTitle ? (
						<Box pi='x16' pbs='x8' pbe='x4' fontScale='p2b' color='default'>
							{t(option.text as TranslationKey)}
						</Box>
					) : (
						<Option key={option.id} onClick={(): void => onSelected(option)}>
							<Box pi='x8' w='full' justifyContent='space-between' display='inline-flex'>
								{t(option.text as TranslationKey)}

								<CheckBox checked={option.checked} onChange={(e): void => onSelected(option, e)} />
							</Box>
						</Option>
					)}
				</Fragment>
			))}
		</Tile>
	);
};

// ------------------- CustomDropDown -------------------

export const CustomDropDown = ({
	dropdownOptions,
	defaultTitle,
	selectedOptionsTitle,
	selectedOptions,
	setSelectedOptions,
	customSetSelected,
}: DropDownProps) => {
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
		<>
			<CustomDropDownAnchor
				ref={reference}
				onClick={toggleCollapsed as any}
				defaultTitle={defaultTitle}
				selectedOptionsTitle={selectedOptionsTitle}
				selectedOptionsCount={count}
				maxCount={dropdownOptions.length}
			/>
			{collapsed && (
				<CustomDropDownListWrapper ref={reference} onClose={onClose}>
					<CustomDropDownList options={dropdownOptions} onSelected={onSelect} />
				</CustomDropDownListWrapper>
			)}
		</>
	);
};

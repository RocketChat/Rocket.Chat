/* eslint-disable react/no-multi-comp */
import { Box, Button, CheckBox, Icon, Option, Tile } from '@rocket.chat/fuselage';
import { useOutsideClick, usePosition, useToggle } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentProps, MouseEventHandler } from 'react';
import React, { Fragment, forwardRef, useCallback, useRef, useState } from 'react';

import { isValidReference } from '../../../marketplace/helpers/isValidReference';
import { onMouseEventPreventSideEffects } from '../../../marketplace/helpers/onMouseEventPreventSideEffects';

/**
 * @param inputData[]: recebe um array de todos os dados
 * @param dropdownOptions[]: recebe um array com as opções que vão aparecer no dropdown, seguindo um formato específico
 * @param filterFunction: função para filtrar o array
 * @returns um componente React e um array filtrado de acordo com uma função passada no dropdown
 */

// TODO: remove multicomponents from file!!!
// TODO: CODE A FILTER FUNCTION WITH USEREDUCER!!!!!
// TODO: add a counter to make the UI change according to the design, like: 'Rooms (5)'

/*
   type TitleOptionProp = {
      id: string;
      text: string;
      isGroupTitle: boolean;
   };
   type CheckboxOptionProp = {
      id: string;
      text: string;
      checked: boolean;
   };
   type DropdownOptionList = TitleOptionProp | CheckboxOptionProp;
*/

type OptionProp =
	| {
			// Different font style, does not have a checkbox and is not clickable. Should be used to create dividers and titles for smaller groups
			id: string;
			text: string;
			isGroupTitle: boolean;
	  }
	| {
			// This option has a checkbox
			id: string;
			text: string;
			checked: boolean;
	  };

type DropDownProps = {
	inputData: any[];
	dropdownOptions: OptionProp[];
	dropdownTitle: TranslationKey;
	filterFunction: (props: any) => any; // tipar a função e o inputData
};

// TODO: move DropDownAnchor to new file!!

type DropDownAnchorProps = {
	onClick?: MouseEventHandler<HTMLElement>;
	dropdownTitle: TranslationKey;
} & ComponentProps<typeof Button>;

export const DropDownAnchor = forwardRef<HTMLElement, DropDownAnchorProps>(function DropDownAnchor(
	{ onClick, dropdownTitle, ...props },
	ref,
) {
	const t = useTranslation();

	return (
		<Button
			ref={ref}
			onClick={onClick}
			display='flex'
			alignItems='center'
			flexDirection='row'
			flexGrow='1'
			flexShrink='1'
			borderColor='none'
			borderWidth='x1'
			bg='surface-light'
			{...props}
		>
			{t(dropdownTitle)}
			<Box mi='x4' display='flex' alignItems='center' justifyContent='center'>
				<Icon name='chevron-down' fontSize='x20' color='hint' />
			</Box>
		</Button>
	);
});

// TODO: move DropDownListWrapper to new file!!

const options = {
	margin: 8,
	placement: 'bottom-end',
} as const;

const hidden = {
	visibility: 'hidden',
	opacity: 0,
	position: 'fixed',
} as const;

export const DropDownListWrapper = forwardRef<Element, ComponentProps<typeof Box> & { onClose: (e: MouseEvent) => void }>(
	function DropDownListWrapper({ children, onClose }, ref) {
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

// TODO: move DropDownList to new file!!

const DropDownList = ({ options, onSelected }: { options: OptionProp[]; onSelected: (item: OptionProp) => void }) => {
	return (
		<Tile overflow='auto' pb='x12' pi={0} elevation='2' w='full' bg='light' borderRadius='x2'>
			{options.map((option, index) => (
				// TODO: how to avoid using key={index}? Should I use option.id?
				<Fragment key={index}>
					{option.isGroupTitle === true && (
						<Box pi='x16' pbs='x8' pbe='x4' fontScale='micro' textTransform='uppercase' color='default'>
							{option.text}
						</Box>
					)}
					{options.map(
						(item) =>
							item.isGroupTitle === false && (
								<Option key={item.id} onClick={(): void => onSelected(item)}>
									<CheckBox checked={item.checked} onChange={(): void => onSelected(item)} />
								</Option>
							),
					)}
				</Fragment>
			))}
		</Tile>
	);
};

// ------------------- RoomsDropDown -------------------

// TODO: remover props: desconstruir

export const RoomsDropDown = (props: DropDownProps) => {
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

	// Everything is selected by default
	const [selectedOptions, setSelectedOptions] = useState(props.dropdownOptions);

	function handleSelectOption(selectedOption: OptionProp) {
		if (selectedOption.checked === true) {
			// the user has enabled this option
			setSelectedOptions([...selectedOptions, selectedOption]);
		} else {
			// the user has disabled this option
			setSelectedOptions(selectedOptions.filter((option: OptionProp) => option.id !== selectedOption.id));
		}
	}

	const handleFilteredOptions = useCallback(() => props.inputData.filter(props.filterFunction(selectedOptions)), [props, selectedOptions]);

	// fazer outra função que chama o hook e chamar no onSelected

	return (
		<>
			<DropDownAnchor ref={reference} onClick={toggleCollapsed as any} dropdownTitle={props.dropdownTitle} />
			{collapsed && (
				<DropDownListWrapper ref={reference} onClose={onClose}>
					<DropDownList
						options={props.dropdownOptions}
						onSelected={() => {
							// TODO: select option
							handleSelectOption(props.dropdownOptions[0]);
							handleFilteredOptions();
						}}
					/>
					{/* TODO: are options being marked as checked??? */}
				</DropDownListWrapper>
			)}
		</>
	);
};

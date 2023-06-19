/* eslint-disable react/no-multi-comp */
import { Box, Button, CheckBox, Icon, Option, Tile } from '@rocket.chat/fuselage';
import { useOutsideClick, usePosition, useToggle } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentProps, MouseEventHandler } from 'react';
import React, { Fragment, createContext, forwardRef, useCallback, useRef, useState } from 'react';

import { isValidReference } from '../../../marketplace/helpers/isValidReference';
import { onMouseEventPreventSideEffects } from '../../../marketplace/helpers/onMouseEventPreventSideEffects';

/**
 * @param inputData[]: recebe um array de todos os dados
 * @param dropdownOptions[]: recebe um array com as opções que vão aparecer no dropdown, seguindo um formato específico
 * @param defaultTitle: título padrão do dropdown, quando não selecionado // For example: 'All rooms'
	@param selectedOptionsTitle: título quando uma ou mais opções forem selecionadas // For example: 'Rooms (3)'
 * @param filterFunction: função (ou função composta por outras funções menores) para filtrar o array
 * @returns um componente React e um array filtrado de acordo com uma função passada no dropdown
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
};

// TODO: move DropDownAnchor to new file!!

type DropDownAnchorProps = {
	onClick?: MouseEventHandler<HTMLElement>;
	defaultTitle: TranslationKey;
	selectedOptionsTitle: TranslationKey;
	selectedOptionsCount: number;
} & ComponentProps<typeof Button>;

export const DropDownAnchor = forwardRef<HTMLElement, DropDownAnchorProps>(function DropDownAnchor(
	{ onClick, selectedOptionsCount, selectedOptionsTitle, defaultTitle, ...props },
	ref,
) {
	const t = useTranslation();

	// TODO: when all options are clicked, should change to "all rooms" title

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
			h='x40'
			{...props}
		>
			{selectedOptionsCount > 0 ? `${t(selectedOptionsTitle)} (${selectedOptionsCount / 2})` : t(defaultTitle)}
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

export const DropDownList = ({ options, onSelected }: { options: OptionProp[]; onSelected: (item: OptionProp) => void }) => {
	const t = useTranslation();

	return (
		<Tile overflow='auto' pb='x12' pi={0} elevation='2' w='full' bg='light' borderRadius='x2'>
			{options.map((option) => (
				<Fragment key={option.id}>
					{/* TODO: mudar desing de acordo com o Figma */}
					{/* TODO: create constructor to accept SelectOption instead of custom type for the CustomDropDown, and then, transform it to the OptionProp by extending it and checking the props -> ver PR da Julia!!! */}
					{option.isGroupTitle ? (
						<Box pi='x16' pbs='x8' pbe='x4' fontScale='p2b' color='default'>
							{t(option.text as TranslationKey)}
						</Box>
					) : (
						<Option key={option.id} onClick={(): void => onSelected(option)}>
							<Box pi='x8' w='full' justifyContent='space-between' display='inline-flex'>
								{t(option.text as TranslationKey)}

								<CheckBox checked={option.checked} onChange={(): void => onSelected(option)} />
							</Box>
						</Option>
					)}
				</Fragment>
			))}
		</Tile>
	);
};

// ------------------- CustomDropDown -------------------

export const CustomDropDownOptionsContext = createContext<OptionProp[]>([]);

export const CustomDropDown = ({ dropdownOptions, defaultTitle, selectedOptionsTitle }: DropDownProps) => {
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
			<CustomDropDownOptionsContext.Provider value={selectedOptions}>
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
			</CustomDropDownOptionsContext.Provider>
		</>
	);
};

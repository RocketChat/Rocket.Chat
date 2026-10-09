import {
	Box,
	CheckBox,
	Icon,
	Item,
	ItemActions,
	ItemContent,
	ItemGroupHeader,
	ItemGroupTitle,
	ItemMedia,
	ItemTitle,
	SearchInput,
	Tile,
} from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import type { ChangeEvent } from 'react';
import { Fragment, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { OptionProp } from './MultiSelectCustom';
import { useFilteredOptions } from './useFilteredOptions';

const getIconColor = (color: 'default' | 'danger' | 'warning' | undefined) => {
	switch (color) {
		case 'danger':
			return 'status-font-on-danger';
		case 'warning':
			return 'status-font-on-warning';
		case 'default':
		default:
			return undefined;
	}
};

const MultiSelectCustomList = ({
	options,
	onSelected,
	searchBarText,
}: {
	options: OptionProp[];
	onSelected: (item: OptionProp, e?: ChangeEvent<HTMLElement>) => void;
	searchBarText?: string;
}) => {
	const { t } = useTranslation();

	const [text, setText] = useState('');

	const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => setText(event.currentTarget.value), []);

	const filteredOptions = useFilteredOptions(text, options);

	return (
		<Tile
			overflow='auto'
			paddingBlock={12}
			paddingInline={0}
			elevation='2'
			width='full'
			backgroundColor='light'
			borderRadius='small'
			maxHeight='50vh'
		>
			{searchBarText && (
				<Box paddingInline={12} marginBlockEnd={12}>
					<SearchInput
						name='select-search'
						placeholder={t(searchBarText as TranslationKey)}
						autoComplete='off'
						endAddon={<Icon name='magnifier' size='x20' />}
						onChange={handleChange}
						value={text}
					/>
				</Box>
			)}
			{filteredOptions.map((option) => (
				<Fragment key={option.id}>
					{option.isGroupTitle || !option.hasOwnProperty('checked') ? (
						<ItemGroupHeader inset='md'>
							<ItemGroupTitle>{t(option.text as TranslationKey)}</ItemGroupTitle>
						</ItemGroupHeader>
					) : (
						<Item inset='md'>
							{option.icon && (
								<ItemMedia variant='icon'>
									<Icon name={option.icon.name} size='x20' color={getIconColor(option.icon.color)} />
								</ItemMedia>
							)}
							<ItemContent>
								<ItemTitle is='label' htmlFor={option.id}>
									{t(option.text as TranslationKey)}
								</ItemTitle>
							</ItemContent>
							<ItemActions>
								<CheckBox checked={option.checked} name={option.text} id={option.id} onChange={() => onSelected(option)} />
							</ItemActions>
						</Item>
					)}
				</Fragment>
			))}
		</Tile>
	);
};

export default MultiSelectCustomList;

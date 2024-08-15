import { Box, CheckBox, Icon, Option, SearchInput, Tile } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { FormEvent } from 'react';
import { Fragment, useCallback, useState } from 'react';

import type { OptionProp } from './MultiSelectCustom';
import { useFilteredOptions } from './useFilteredOptions';

const MultiSelectCustomList = ({
	options,
	onSelected,
	searchBarText,
}: {
	options: OptionProp[];
	onSelected: (item: OptionProp, e?: FormEvent<HTMLElement>) => void;
	searchBarText?: TranslationKey;
}) => {
	const t = useTranslation();

	const [text, setText] = useState('');

	const handleChange = useCallback((event: FormEvent<HTMLInputElement>) => setText(event.currentTarget.value), []);

	const filteredOptions = useFilteredOptions(text, options);

	return (
		<Tile overflow='auto' pb='x12' pi={0} elevation='2' w='full' bg='light' borderRadius='x2'>
			{searchBarText && (
				<Option>
					<SearchInput
						name='select-search'
						placeholder={t(searchBarText)}
						autoComplete='off'
						addon={<Icon name='magnifier' size='x20' />}
						onChange={handleChange}
						value={text}
					/>
				</Option>
			)}
			{filteredOptions.map((option) => (
				<Fragment key={option.id}>
					{option.hasOwnProperty('checked') ? (
						<Option key={option.id}>
							<Box pis='x4' pb='x4' w='full' display='flex' justifyContent='space-between' is='label'>
								{t(option.text as TranslationKey)}

								<CheckBox checked={option.checked} pi={0} name={option.text} id={option.id} onChange={() => onSelected(option)} />
							</Box>
						</Option>
					) : (
						<Box mi='x12' mb='x4' fontScale='p2b' color='default'>
							{t(option.text as TranslationKey)}
						</Box>
					)}
				</Fragment>
			))}
		</Tile>
	);
};

export default MultiSelectCustomList;

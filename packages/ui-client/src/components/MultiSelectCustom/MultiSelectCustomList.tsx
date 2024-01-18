import { Box, CheckBox, Icon, Margins, Option, SearchInput, Tile } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { FormEvent } from 'react';
import { Fragment, useCallback, useState } from 'react';

import { isCheckboxOptionProp, type OptionProp } from './MultiSelectCustom';
import { useFilteredOptions } from './useFilteredOptions';

const MultiSelectCustomList = ({
	options,
	onSelected,
	searchBarText,
}: {
	options: OptionProp[];
	onSelected: (item: OptionProp, e?: FormEvent<HTMLElement>) => void;
	searchBarText?: string;
}) => {
	const t = useTranslation();

	const [text, setText] = useState('');

	const handleChange = useCallback((event) => setText(event.currentTarget.value), []);

	const filteredOptions = useFilteredOptions(text, options);

	return (
		<Tile overflow='auto' pb={12} pi={0} elevation='2' w='full' bg='light' borderRadius={2}>
			{searchBarText && (
				<Margins blockEnd={12} inline={12}>
					<SearchInput
						name='select-search'
						placeholder={t(searchBarText as TranslationKey)}
						autoComplete='off'
						addon={<Icon name='magnifier' size='x20' />}
						onChange={handleChange}
						value={text}
					/>
				</Margins>
			)}
			{filteredOptions.map((option) => (
				<Fragment key={option.id}>
					{!isCheckboxOptionProp(option) ? (
						<Box mi={12} mb={4} fontScale='p2b' color='default'>
							{t(option.text as TranslationKey)}
						</Box>
					) : (
						<Option key={option.id}>
							<Box w='full' display='flex' justifyContent='space-between' is='label'>
								{t(option.text as TranslationKey)}

								<CheckBox checked={option.checked} pi={0} name={option.text} id={option.id} onChange={() => onSelected(option)} />
							</Box>
						</Option>
					)}
				</Fragment>
			))}
		</Tile>
	);
};

export default MultiSelectCustomList;

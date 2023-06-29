import { Box, CheckBox, Icon, Option, TextInput, Tile } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { FormEvent } from 'react';
import { Fragment, useCallback, useEffect, useState } from 'react';

import type { OptionProp } from './MultiSelectCustom';
import { useFilteredOptions } from './useFilteredOptions';

export const MultiSelectCustomList = ({
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
	const handleChange = useCallback((event) => setText(event.currentTarget.value), []);

	const [optionSearch, setOptionSearch] = useState('');

	useEffect(() => setOptionSearch(text), [setOptionSearch, text]);

	const filteredOptions = useFilteredOptions(optionSearch, options);

	// TODO: check if the search bar margins are correct with the Design team

	return (
		<Tile overflow='auto' pb='x12' pi={0} elevation='2' w='full' bg='light' borderRadius='x2'>
			{searchBarText && (
				<Option>
					<Box mi='x8' mbs='x4' display='flex' flexWrap='wrap' alignItems='center'>
						<TextInput
							flexGrow={2}
							minWidth='x240'
							placeholder={t(searchBarText)}
							addon={<Icon name='magnifier' size='x20' />}
							onChange={handleChange}
							value={text}
						/>
					</Box>
				</Option>
			)}
			{filteredOptions.map((option) => (
				<Fragment key={option.id}>
					{option.isGroupTitle ? (
						<Box pi='x16' pbs='x8' pbe='x4' fontScale='p2b' color='default'>
							{t(option.text as TranslationKey)}
						</Box>
					) : (
						<Option key={option.id} onClick={(): void => onSelected(option)}>
							<Box pi='x8' w='full' justifyContent='space-between' display='flex'>
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

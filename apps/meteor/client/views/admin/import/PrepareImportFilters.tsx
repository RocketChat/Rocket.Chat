import { Box, TextInput, Icon } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { Dispatch, SetStateAction } from 'react';
import React, { useCallback, useState } from 'react';

const PrepareImportFilters = ({ setFilters }: { setFilters: Dispatch<SetStateAction<string>> }) => {
	const t = useTranslation();
	const [text, setText] = useState('');

	const handleSearchTextChange = useCallback(
		(event) => {
			const text = event.currentTarget.value;
			setFilters(text);
			setText(text);
		},
		[setFilters],
	);

	return (
		<Box
			is='form'
			onSubmit={useCallback((e) => e.preventDefault(), [])}
			mb='x8'
			display='flex'
			flexWrap='wrap'
			alignItems='center'
			justifyContent='center'
			width='full'
		>
			<Box minWidth='x224' maxWidth='590px' display='flex' m='x4' flexGrow={2}>
				<TextInput
					name='search-importer'
					alignItems='center'
					placeholder={t('Search_importer')}
					addon={<Icon name='magnifier' size='x20' />}
					onChange={handleSearchTextChange}
					value={text}
				/>
			</Box>
		</Box>
	);
};

export default PrepareImportFilters;

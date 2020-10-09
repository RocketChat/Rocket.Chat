import { Box, Icon, TextInput } from '@rocket.chat/fuselage';
import React, { useCallback, useState, useEffect, memo, FC } from 'react';

import { useTranslation } from '../../contexts/TranslationContext';

type FilterByTextProps = {
	setFilter: (input: { text: string }) => void;
};

const FilterByText: FC<FilterByTextProps> = ({ setFilter, ...props }) => {
	const t = useTranslation();

	const [text, setText] = useState('');

	const handleChange = useCallback((event) => setText(event.currentTarget.value), []);

	useEffect(() => {
		setFilter({ text });
	}, [setFilter, text]);

	return <Box mb='x16' is='form' onSubmit={useCallback((e) => e.preventDefault(), [])} display='flex' flexDirection='column' {...props}>
		<TextInput placeholder={t('Search_Apps')} addon={<Icon name='magnifier' size='x20'/>} onChange={handleChange} value={text} />
	</Box>;
};

export default memo(FilterByText);

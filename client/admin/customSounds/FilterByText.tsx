import React, { FC, useCallback, useState, useEffect } from 'react';
import { Box, TextInput, Icon } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';

type FilterByTextProps = {
	setFilter: (filter: { text: string }) => void;
};

const FilterByText: FC<FilterByTextProps> = ({ setFilter, ...props }) => {
	const t = useTranslation();
	const [text, setText] = useState('');
	const handleChange = useCallback((event) => setText(event.currentTarget.value), []);

	useEffect(() => {
		setFilter({ text });
	}, [setFilter, text]);
	return <Box mb='x16' is='form' onSubmit={useCallback((e) => e.preventDefault(), [])} display='flex' flexDirection='column' {...props}>
		<TextInput flexShrink={0} placeholder={t('Search')} addon={<Icon name='magnifier' size='x20'/>} onChange={handleChange} value={text} />
	</Box>;
};

export default FilterByText;

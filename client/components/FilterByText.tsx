import { Box, Icon, TextInput, Button } from '@rocket.chat/fuselage';
import React, { FC, ChangeEvent, FormEvent, memo, useCallback, useEffect, useState } from 'react';

import { useTranslation } from '../contexts/TranslationContext';

type FilterByTextProps = {
	placeholder?: string;
	onChange: (filter: { text: string }) => void;
	displayButton: boolean;
	textButton: string;
	onButtonClick: () => void;
};

const FilterByText: FC<FilterByTextProps> = ({
	placeholder,
	onChange: setFilter,
	displayButton: display = false,
	textButton = '',
	onButtonClick,
	...props
}) => {
	const t = useTranslation();

	const [text, setText] = useState('');

	const handleInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
		setText(event.currentTarget.value);
	}, []);

	useEffect(() => {
		setFilter({ text });
	}, [setFilter, text]);

	const handleFormSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
	}, []);

	return <Box mb='x16' is='form' onSubmit={handleFormSubmit} display='flex' flexDirection='row' {...props}>
		<TextInput placeholder={placeholder ?? t('Search')} addon={<Icon name='magnifier' size='x20'/>} onChange={handleInputChange} value={text} />
		<Button onClick={onButtonClick} display={display ? 'block' : 'none'} mis='x8' primary>{textButton}</Button>
	</Box>;
};

export default memo(FilterByText);

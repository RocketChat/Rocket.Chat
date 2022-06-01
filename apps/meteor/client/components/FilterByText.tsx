import { Box, Icon, TextInput, Button } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC, ChangeEvent, FormEvent, memo, useCallback, useEffect, useState } from 'react';

type FilterByTextProps = {
	placeholder?: string;
	onChange: (filter: { text: string }) => void;
	inputRef?: () => void;
};

type FilterByTextPropsWithButton = FilterByTextProps & {
	displayButton: true;
	textButton: string;
	onButtonClick: () => void;
};

const isFilterByTextPropsWithButton = (props: any): props is FilterByTextPropsWithButton =>
	'displayButton' in props && props.displayButton === true;

const FilterByText: FC<FilterByTextProps> = ({ placeholder, onChange: setFilter, inputRef, children, ...props }) => {
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

	return (
		<Box mb='x16' is='form' onSubmit={handleFormSubmit} display='flex' flexDirection='row' {...props}>
			<TextInput
				placeholder={placeholder ?? t('Search')}
				ref={inputRef}
				addon={<Icon name='magnifier' size='x20' />}
				onChange={handleInputChange}
				value={text}
			/>
			{isFilterByTextPropsWithButton(props) ? (
				<Button onClick={props.onButtonClick} mis='x8' primary>
					{props.textButton}
				</Button>
			) : (
				children && (
					<Box mis='x8' display='flex' flexDirection='row'>
						{children}
					</Box>
				)
			)}
		</Box>
	);
};

export default memo<FC<FilterByTextProps>>(FilterByText);

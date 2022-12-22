import { Box, Icon, TextInput, Button } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactNode, ChangeEvent, FormEvent, ReactElement } from 'react';
import React, { memo, useCallback, useEffect, useState } from 'react';

type FilterByTextCommonProps = {
	children?: ReactNode | undefined;
	placeholder?: string;
	inputRef?: () => void;
	shouldFiltersStack?: boolean;
	onChange: (filter: { text: string }) => void;
};

type FilterByTextPropsWithButton = FilterByTextCommonProps & {
	displayButton: true;
	textButton: string;
	onButtonClick: () => void;
};

type FilterByTextProps = FilterByTextCommonProps | FilterByTextPropsWithButton;

const isFilterByTextPropsWithButton = (props: any): props is FilterByTextPropsWithButton =>
	'displayButton' in props && props.displayButton === true;

const FilterByText = ({
	placeholder,
	onChange: setFilter,
	inputRef,
	children,
	shouldFiltersStack,
	...props
}: FilterByTextProps): ReactElement => {
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
		<Box mb='x16' is='form' onSubmit={handleFormSubmit} display='flex' flexDirection={shouldFiltersStack ? 'column' : 'row'}>
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
					<Box mis={shouldFiltersStack ? '' : 'x8'} display='flex' flexDirection={shouldFiltersStack ? 'column' : 'row'}>
						{children}
					</Box>
				)
			)}
		</Box>
	);
};

export default memo<FilterByTextProps>(FilterByText);

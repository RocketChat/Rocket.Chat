import { Box, Icon, TextInput, Button, Margins } from '@rocket.chat/fuselage';
import { useAutoFocus, useMergedRefs } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactNode, ChangeEvent, FormEvent } from 'react';
import React, { forwardRef, memo, useCallback, useEffect, useState } from 'react';

type FilterByTextCommonProps = {
	children?: ReactNode | undefined;
	placeholder?: string;
	onChange: (filter: { text: string }) => void;
	shouldAutoFocus?: boolean;
};

type FilterByTextPropsWithButton = FilterByTextCommonProps & {
	displayButton: true;
	textButton: string;
	onButtonClick: () => void;
};

type FilterByTextProps = FilterByTextCommonProps | FilterByTextPropsWithButton;

const isFilterByTextPropsWithButton = (props: any): props is FilterByTextPropsWithButton =>
	'displayButton' in props && props.displayButton === true;

const FilterByText = forwardRef<HTMLInputElement, FilterByTextProps>(function FilterByText(
	{ placeholder, onChange: setFilter, shouldAutoFocus = false, children, ...props },
	ref,
) {
	const t = useTranslation();
	const [text, setText] = useState('');
	const autoFocusRef = useAutoFocus(shouldAutoFocus);
	const mergedRefs = useMergedRefs(ref, autoFocusRef);

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
		<Box mb={16} mi='neg-x4' is='form' onSubmit={handleFormSubmit} display='flex' flexWrap='wrap' alignItems='center'>
			<Box mi={4} display='flex' flexGrow={1}>
				<TextInput
					placeholder={placeholder ?? t('Search')}
					ref={mergedRefs}
					addon={<Icon name='magnifier' size='x20' />}
					onChange={handleInputChange}
					value={text}
					flexGrow={2}
					minWidth='x220'
				/>
			</Box>
			{isFilterByTextPropsWithButton(props) ? (
				<Button onClick={props.onButtonClick} mis={8} primary>
					{props.textButton}
				</Button>
			) : (
				children && <Margins all='x4'>{children}</Margins>
			)}
		</Box>
	);
});

export default memo(FilterByText);

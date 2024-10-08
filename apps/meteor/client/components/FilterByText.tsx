import { Box, Icon, TextInput, Margins } from '@rocket.chat/fuselage';
import { useAutoFocus, useMergedRefs } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ChangeEvent, FormEvent, HTMLAttributes } from 'react';
import React, { forwardRef, memo, useCallback, useState } from 'react';

type FilterByTextProps = {
	onChange: (filter: string) => void;
	shouldAutoFocus?: boolean;
} & Omit<HTMLAttributes<HTMLInputElement>, 'is' | 'onChange'>;

const FilterByText = forwardRef<HTMLInputElement, FilterByTextProps>(function FilterByText(
	{ placeholder, onChange: setFilter, shouldAutoFocus = false, children, ...props },
	ref,
) {
	const t = useTranslation();
	const [text, setText] = useState('');
	const autoFocusRef = useAutoFocus(shouldAutoFocus);
	const mergedRefs = useMergedRefs(ref, autoFocusRef);

	const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
		setText(event.currentTarget.value);
		setFilter(event.currentTarget.value);
	};

	const handleFormSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
	}, []);

	return (
		<Box mb={16} mi='neg-x4' is='form' onSubmit={handleFormSubmit} display='flex' flexWrap='wrap' alignItems='center'>
			<Box mi={4} display='flex' flexGrow={1}>
				<TextInput
					{...props}
					placeholder={placeholder ?? t('Search')}
					ref={mergedRefs}
					addon={<Icon name='magnifier' size='x20' />}
					onChange={handleInputChange}
					value={text}
					flexGrow={2}
					minWidth='x220'
					aria-label={placeholder ?? t('Search')}
				/>
			</Box>
			{children && <Margins inline={4}>{children}</Margins>}
		</Box>
	);
});

export default memo(FilterByText);

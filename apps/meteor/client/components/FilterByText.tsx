import { Box, Icon, TextInput } from '@rocket.chat/fuselage';
import { useAutoFocus, useMergedRefs } from '@rocket.chat/fuselage-hooks';
import type { ChangeEvent, ComponentPropsWithoutRef, SubmitEvent } from 'react';
import { forwardRef, memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

// TODO: consider changing the type of TextInput's `onChange` to (event: ChangeEvent<HTMLInputElement>) => void
export type FilterByTextProps = Omit<ComponentPropsWithoutRef<typeof TextInput>, 'onChange'> & {
	shouldAutoFocus?: boolean;
	onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
};

const FilterByText = forwardRef<HTMLInputElement, FilterByTextProps>(function FilterByText(
	{ placeholder, shouldAutoFocus = false, children, ...props },
	ref,
) {
	const { t } = useTranslation();
	const autoFocusRef = useAutoFocus(shouldAutoFocus);
	const mergedRefs = useMergedRefs(ref, autoFocusRef);

	const handleFormSubmit = useCallback((event: SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();
	}, []);

	return (
		<Box marginBlock='x16' is='form' onSubmit={handleFormSubmit} display='flex' flexWrap='wrap' alignItems='center' columnGap='x8'>
			<Box display='flex' flexGrow={1} minWidth='x280'>
				<TextInput
					{...props}
					placeholder={placeholder ?? t('Search')}
					ref={mergedRefs}
					endAddon={<Icon name='magnifier' size='x20' />}
					aria-label={placeholder ?? t('Search')}
				/>
			</Box>
			{children}
		</Box>
	);
});

export default memo(FilterByText);
